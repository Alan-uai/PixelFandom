
'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, LogOut, Save, Upload, Sparkles, AlertCircle } from 'lucide-react';
import Head from 'next/head';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirebase, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { GeneralItemUploader } from '@/components/profile/GeneralItemUploader';
import { ReputationSection } from '@/components/profile/ReputationSection';
import { UserFeedbackSection } from '@/components/profile/UserFeedbackSection';
import { CharacterInventory } from '@/components/profile/CharacterInventory';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { useGlobalBonuses } from '@/hooks/use-global-bonuses';
import { allGameData } from '@/lib/game-data-context';
import { energyGainPerRank } from '@/lib/energy-gain-data';
import { extractStatsFromImage } from '@/ai/flows/extract-stats-from-image-flow';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { profileCategories } from '@/lib/profile-config';

const MAX_RANK = 205;
const MAX_PRESTIGE = 5;
const MAX_LEVEL = 270;
const MAX_WORLD = allGameData.length;

const suffixes = ["", "k", "M", "B", "T", "qd", "Qn", "sx", "Sp", "O", "N", "de", "Ud", "dD", "tD", "qdD", "QnD", "sxD", "SpD", "OcD", "NvD", "Vgn", "UVg", "DVg", "TVg", "qtV", "QnV", "SeV", "SPG", "OVG", "NVG", "TGN", "UTG", "DTG", "tsTG", "qTG", "QnTG", "ssTG", "SpTG", "OcTG", "NoTG", "QDR", "uQDR", "dQDR", "tQDR"];

const statsSchema = z.object({
    currentWorld: z.string().min(1, 'O mundo atual é obrigatório.'),
    rank: z.string().min(1, 'O rank é obrigatório.'),
    prestige: z.string().min(1, 'O prestígio é obrigatório.'),
    level: z.string().min(1, 'O nível é obrigatório.'),
    energyGainValue: z.string().min(1, 'O valor é obrigatório.'),
    energyGainSuffix: z.string(),
    totalDamageValue: z.string().min(1, 'O valor é obrigatório.'),
    totalDamageSuffix: z.string(),
    currentEnergyValue: z.string().min(1, 'O valor é obrigatório.'),
    currentEnergySuffix: z.string(),
});

type StatsFormData = z.infer<typeof statsSchema>;

const formatWithSuffix = (num: number): { value: string, suffix: string } => {
    if (num < 1000) return { value: num.toFixed(2), suffix: '' };
    const i = Math.floor(Math.log10(num) / 3);
    const value = (num / Math.pow(1000, i));
    return { value: value.toFixed(2), suffix: suffixes[i] || '' };
};

const parseSuffixedNumber = (value: string, suffix: string): number => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return 0;
    
    const suffixMap: Record<string, number> = {
        k: 1e3, M: 1e6, B: 1e9, T: 1e12, qd: 1e15, Qn: 1e18, sx: 1e21, Sp: 1e24,
        O: 1e27, N: 1e30, de: 1e33, Ud: 1e36, dD: 1e39, tD: 1e42, qdD: 1e45, QnD: 1e48,
        sxD: 1e51, SpD: 1e54, OcD: 1e57, NvD: 1e60, Vgn: 1e63, UVg: 1e66, DVg: 1e69,
        TVg: 1e72, qtV: 1e75, QnV: 1e78, SeV: 1e81, SPG: 1e84, OVG: 1e87, NVG: 1e90,
        TGN: 1e93, UTG: 1e96, DTG: 1e99, tsTG: 1e102, qTG: 1e105, QnTG: 1e108, ssTG: 1e111,
        SpTG: 1e114, OcTG: 1e117, NoTG: 1e120, QDR: 1e123, uQDR: 1e126, dQDR: 1e129,
        tQDR: 1e132
    };

    const multiplier = suffixMap[suffix] || 1;
    return numericValue * multiplier;
};

const updateUserProfileJson = async (userId: string, firestore: any) => {
    if (!userId || !firestore) return;
    try {
        const userRef = doc(firestore, 'users', userId);
        const userSnap = await getDoc(userRef);
        let profileJson: any = {};
        if (userSnap.exists()) {
            profileJson.stats = userSnap.data();
        }

        for (const category of profileCategories) {
            const itemsSnap = await getDocs(collection(firestore, 'users', userId, category.subcollectionName));
            if (!itemsSnap.empty) {
                profileJson[category.subcollectionName] = itemsSnap.docs.map(d => d.data());
            }
        }
        await updateDoc(userRef, { userProfile: profileJson });
    } catch (error) {
        console.error("Failed to update user profile JSON:", error);
    }
};

function MyStatsForm() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const router = useRouter();

    const [isSaving, setIsSaving] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const { bonuses: maxBonuses, isLoading: areBonusesLoading } = useGlobalBonuses("0", true);

    const form = useForm<StatsFormData>({
        resolver: zodResolver(statsSchema),
        defaultValues: {
            currentWorld: '',
            rank: '',
            prestige: '0',
            level: '1',
            energyGainValue: '',
            energyGainSuffix: '',
            totalDamageValue: '',
            totalDamageSuffix: '',
            currentEnergyValue: '',
            currentEnergySuffix: '',
        },
    });

    useEffect(() => {
        async function fetchUserData() {
            if (user && firestore) {
                const userRef = doc(firestore, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    form.reset({
                        currentWorld: data.currentWorld || '',
                        rank: data.rank ? String(data.rank) : '',
                        prestige: data.prestige ? String(data.prestige) : '0',
                        level: data.level ? String(data.level) : '1',
                        ...splitValueAndSuffix(data.currentEnergy || '', 'currentEnergy'),
                        ...splitValueAndSuffix(data.totalDamage || '', 'totalDamage'),
                        ...splitValueAndSuffix(data.energyGain || '', 'energyGain'),
                    });
                }
            }
        }
        fetchUserData();
    }, [user, firestore, form]);

    const splitValueAndSuffix = (fullValue: string, fieldPrefix: 'totalDamage' | 'currentEnergy' | 'energyGain') => {
        if (!fullValue) return { [`${fieldPrefix}Value`]: '', [`${fieldPrefix}Suffix`]: '' };
        const foundSuffix = suffixes.slice().reverse().find(s => s && fullValue.toLowerCase().endsWith(s.toLowerCase()));
        if (foundSuffix) {
            const valuePart = fullValue.slice(0, -foundSuffix.length);
            return { [`${fieldPrefix}Value`]: valuePart, [`${fieldPrefix}Suffix`]: foundSuffix };
        }
        return { [`${fieldPrefix}Value`]: fullValue, [`${fieldPrefix}Suffix`]: '' };
    };

    const handleCalculateMaxStats = () => {
        const { value, suffix } = formatWithSuffix(maxBonuses.damage);
        form.setValue('currentWorld', String(MAX_WORLD));
        form.setValue('rank', String(MAX_RANK));
        form.setValue('prestige', String(MAX_PRESTIGE));
        form.setValue('level', String(MAX_LEVEL));
        form.setValue('totalDamageValue', value);
        form.setValue('totalDamageSuffix', suffix);
        form.setValue('energyGainValue', 'Automático');
        form.setValue('energyGainSuffix', '');
        form.setValue('currentEnergyValue', '');
        form.setValue('currentEnergySuffix', '');

        toast({
            title: "Valores Máximos Calculados!",
            description: "Os campos foram preenchidos com os stats máximos teóricos."
        });
    };

    const onSubmit = async (values: StatsFormData) => {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não autenticado.' });
            return;
        }
        setIsSaving(true);
        try {
            const userRef = doc(firestore, 'users', user.uid);
            
            const dataToSave = {
                currentWorld: values.currentWorld,
                rank: parseInt(values.rank, 10),
                prestige: parseInt(values.prestige, 10),
                level: parseInt(values.level, 10),
                totalDamage: `${values.totalDamageValue}${values.totalDamageSuffix}`,
                totalDamage_numeric_scientific: parseSuffixedNumber(values.totalDamageValue, values.totalDamageSuffix),
                energyGain: `${values.energyGainValue}${values.energyGainSuffix}`,
                energyGain_numeric_scientific: parseSuffixedNumber(values.energyGainValue, values.energyGainSuffix),
                currentEnergy: `${values.currentEnergyValue}${values.currentEnergySuffix}`,
                currentEnergy_numeric_scientific: parseSuffixedNumber(values.currentEnergyValue, values.currentEnergySuffix),
            };

            await updateDoc(userRef, dataToSave);
            
            await updateUserProfileJson(user.uid, firestore);

            toast({ title: 'Perfil Atualizado!', description: 'Suas informações foram salvas.' });

        } catch (error: any) {
            console.error('Error saving stats:', error);
            toast({ variant: 'destructive', title: 'Erro ao Salvar', description: 'Não foi possível salvar suas informações.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        toast({ title: 'Analisando Imagem...', description: 'A IA está lendo suas estatísticas.' });

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const fileDataUri = reader.result as string;
                const result = await extractStatsFromImage({ image: fileDataUri });
                
                const foundFields: string[] = [];
                if (result.currentWorld) { form.setValue('currentWorld', result.currentWorld.replace(/\D/g, '')); foundFields.push('Mundo'); }
                if (result.rank) { form.setValue('rank', result.rank); foundFields.push('Rank'); }
                if (result.totalDamage) { const {value, suffix} = splitValueAndSuffix(result.totalDamage, 'totalDamage'); form.setValue('totalDamageValue', value.totalDamageValue); form.setValue('totalDamageSuffix', value.totalDamageSuffix); foundFields.push('Dano'); }
                if (result.energyGain) { const {value, suffix} = splitValueAndSuffix(result.energyGain, 'energyGain'); form.setValue('energyGainValue', value.energyGainValue); form.setValue('energyGainSuffix', value.energyGainSuffix); foundFields.push('Energia'); }

                if (foundFields.length > 0) toast({ title: 'Campos Preenchidos!', description: `A IA encontrou: ${foundFields.join(', ')}.` });
                else toast({ variant: 'destructive', title: 'Nada Encontrado', description: `Não foi possível extrair dados da imagem.` });
            };
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro na Análise', description: 'Não foi possível extrair dados da imagem.' });
        } finally {
            setIsAnalyzing(false);
            if(imageInputRef.current) imageInputRef.current.value = '';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Minhas Estatísticas</CardTitle>
                <CardDescription>
                    Gerencie suas estatísticas para obter cálculos precisos no chat da IA.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-2 gap-2 mb-4">
                    <input type="file" ref={imageInputRef} onChange={handleImageUpload} style={{ display: 'none' }} accept="image/*" />
                    <Button variant="outline" className='w-full' onClick={() => imageInputRef.current?.click()} disabled={isAnalyzing}>
                         {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        {isAnalyzing ? 'Analisando...' : 'Enviar Imagem'}
                    </Button>
                     <Button variant="outline" className='w-full' onClick={handleCalculateMaxStats} disabled={areBonusesLoading}>
                         {areBonusesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                         Calcular Máximo
                    </Button>
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="currentWorld" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mundo Atual</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <ScrollArea className="h-72">
                                                {allGameData.map((world, index) => (
                                                    <SelectItem key={world.id} value={String(index + 1)}>{world.name}</SelectItem>
                                                ))}
                                            </ScrollArea>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormField control={form.control} name="rank" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Seu Rank</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <ScrollArea className="h-72">
                                                {Array.from({ length: MAX_RANK + 1 }, (_, i) => i).map(rankNum => (
                                                    <SelectItem key={rankNum} value={String(rankNum)}>Rank {rankNum}</SelectItem>
                                                ))}
                                            </ScrollArea>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="prestige" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Prestígio Atual</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Array.from({ length: MAX_PRESTIGE + 1 }, (_, i) => i).map(pNum => (
                                                <SelectItem key={pNum} value={String(pNum)}>Prestígio {pNum}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormField control={form.control} name="level" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nível Atual</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <ScrollArea className="h-72">
                                                {Array.from({ length: MAX_LEVEL + 1 }, (_, i) => i).map(levelNum => (
                                                    <SelectItem key={levelNum} value={String(levelNum)}>Nível {levelNum}</SelectItem>
                                                ))}
                                            </ScrollArea>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>
                        
                        <FormField control={form.control} name="totalDamageValue" render={() => (
                           <FormItem>
                            <FormLabel>Dano Total (DPS)</FormLabel>
                                <div className="flex gap-2">
                                     <FormField control={form.control} name="totalDamageValue" render={({ field }) => ( <FormControl><Input placeholder="ex: 1.5" {...field} /></FormControl>)} />
                                     <FormField control={form.control} name="totalDamageSuffix" render={({ field }) => (
                                         <Select onValueChange={(v) => field.onChange(v === 'none' ? '' : v)} defaultValue={field.value || 'none'} value={field.value || 'none'}>
                                             <FormControl><SelectTrigger className="w-[120px]"><SelectValue placeholder="Sigla" /></SelectTrigger></FormControl>
                                             <SelectContent><ScrollArea className="h-72">{suffixes.map(s => <SelectItem key={s || 'none'} value={s || 'none'}>{s || 'Nenhuma'}</SelectItem>)}</ScrollArea></SelectContent>
                                         </Select>
                                     )} />
                                </div>
                                <FormMessage />
                           </FormItem>
                        )}/>
                        <FormField control={form.control} name="currentEnergyValue" render={() => (
                           <FormItem>
                            <FormLabel>Energia Atual (Acumulada)</FormLabel>
                                <div className="flex gap-2">
                                     <FormField control={form.control} name="currentEnergyValue" render={({ field }) => ( <FormControl><Input placeholder="ex: 1.5" {...field} /></FormControl>)} />
                                     <FormField control={form.control} name="currentEnergySuffix" render={({ field }) => (
                                         <Select onValueChange={(v) => field.onChange(v === 'none' ? '' : v)} defaultValue={field.value || 'none'} value={field.value || 'none'}>
                                             <FormControl><SelectTrigger className="w-[120px]"><SelectValue placeholder="Sigla" /></SelectTrigger></FormControl>
                                             <SelectContent><ScrollArea className="h-72">{suffixes.map(s => <SelectItem key={s || 'none'} value={s || 'none'}>{s || 'Nenhuma'}</SelectItem>)}</ScrollArea></SelectContent>
                                         </Select>
                                     )} />
                                </div>
                                <FormMessage />
                           </FormItem>
                        )}/>
                        <FormField control={form.control} name="energyGainValue" render={() => (
                           <FormItem>
                            <FormLabel>Ganho de Energia (por clique)</FormLabel>
                                <div className="flex gap-2">
                                     <FormField control={form.control} name="energyGainValue" render={({ field }) => ( <FormControl><Input placeholder="ex: 87.04" {...field} /></FormControl>)} />
                                     <FormField control={form.control} name="energyGainSuffix" render={({ field }) => (
                                         <Select onValueChange={(v) => field.onChange(v === 'none' ? '' : v)} defaultValue={field.value || 'none'} value={field.value || 'none'}>
                                             <FormControl><SelectTrigger className="w-[120px]"><SelectValue placeholder="Sigla" /></SelectTrigger></FormControl>
                                             <SelectContent><ScrollArea className="h-72">{suffixes.map(s => <SelectItem key={s || 'none'} value={s || 'none'}>{s || 'Nenhuma'}</SelectItem>)}</ScrollArea></SelectContent>
                                         </Select>
                                     )} />
                                </div>
                                <FormMessage />
                           </FormItem>
                        )}/>
                        <Button type="submit" disabled={isSaving} className="w-full">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Salvar Estatísticas
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}


export default function ProfilePage() {
    const auth = useAuth();
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [hasStats, setHasStats] = useState(true);

     useEffect(() => {
        if (user && user.uid && firestore) {
            const checkStats = async () => {
                const userRef = doc(firestore, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    if (!data.rank && !data.totalDamage) {
                        setHasStats(false);
                    } else {
                        setHasStats(true);
                    }
                } else {
                    setHasStats(false);
                }
            };
            checkStats();
        }
    }, [user, firestore]);

    const handleSignOut = async () => {
        if (auth) {
            try {
                await signOut(auth);
                toast({ title: 'Logout efetuado com sucesso.'});
            } catch (error) {
                console.error("Logout error", error);
                toast({ variant: 'destructive', title: 'Erro ao fazer logout.'});
            }
        }
    };
    
    if (isUserLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
  
    return (
        <>
            <Head>
                <title>Meu Perfil - Guia Eterno</title>
            </Head>
            <div className="space-y-8">
                <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className='flex items-center gap-4'>
                         <User className="h-8 w-8 text-primary"/>
                         <div>
                            <h1 className="text-3xl font-bold tracking-tight font-headline">Meu Perfil</h1>
                            <p className="text-muted-foreground">Gerencie seus dados do jogo, reputação e configurações.</p>
                         </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <GeneralItemUploader />
                        <Button variant="outline" onClick={handleSignOut}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Sair
                        </Button>
                    </div>
                </header>

                {!hasStats && (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Complete seu Perfil!</AlertTitle>
                        <AlertDescription>
                            Preencha suas estatísticas abaixo para receber dicas e cálculos personalizados da IA.
                        </AlertDescription>
                    </Alert>
                )}

                <MyStatsForm />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ReputationSection />
                    <UserFeedbackSection />
                </div>

                <CharacterInventory />
            </div>
        </>
    );
}
