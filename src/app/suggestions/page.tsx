
'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser, useFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { useAdmin } from '@/hooks/use-admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert, Inbox, Download, User, Image as ImageIcon, ThumbsDown, Bot, MessageSquare, AlertTriangle, Check, Eye } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Head from 'next/head';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { micromark } from 'micromark';
import { useMemo, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


interface Suggestion {
  id: string;
  userId: string;
  userEmail: string;
  title: string;
  content: string;
  attachmentURLs?: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

interface NegativeFeedback {
  id: string;
  userId: string;
  userEmail: string;
  question: string;
  negativeResponse: string;
  aiSuggestion: string;
  reputationPointsAwarded?: number;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  status: 'pending' | 'reviewing' | 'fixed';
  reviewedBy?: string;
}

function ContentSuggestionsTab() {
  const firestore = useFirestore();
  const suggestionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'contentSuggestions'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: suggestions, isLoading } = useCollection<Suggestion>(suggestionsQuery as any);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Carregando sugestões...</p>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
       <div className="flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-lg p-12 h-96">
        <Inbox className="h-16 w-16 mb-4" />
        <h2 className="text-2xl font-semibold">Nenhuma Sugestão Encontrada</h2>
        <p className="mt-2">Quando os usuários enviarem sugestões, elas aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="space-y-4 pr-4">
        {suggestions.map((suggestion) => (
          <Card key={suggestion.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0 bg-card/50 border-b">
              <div className="flex-1">
                <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-xs mt-1">
                  <User className="h-3 w-3" /> 
                  Enviado por {suggestion.userEmail || 'Usuário Anônimo'}
                </CardDescription>
              </div>
              <div className="text-right">
                <Badge variant={suggestion.status === 'pending' ? 'secondary' : 'default'}>
                  {suggestion.status}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {suggestion.createdAt ? formatDistanceToNow(new Date(suggestion.createdAt.seconds * 1000), { addSuffix: true, locale: ptBR }) : '...'}
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{suggestion.content}</p>
            </CardContent>
            {suggestion.attachmentURLs && suggestion.attachmentURLs.length > 0 && (
              <>
                <Separator />
                <CardFooter className="p-4 bg-card/30">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Anexos</h4>
                    <div className="flex flex-wrap gap-2">
                      {suggestion.attachmentURLs.map((url, index) => {
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                        if (isImage) {
                          return (
                            <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="relative h-20 w-20 rounded-md overflow-hidden border">
                              <Image src={url} alt={`Anexo ${index + 1}`} layout="fill" objectFit="cover" />
                            </a>
                          );
                        }
                        return (
                          <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">
                              <Download className="mr-2 h-4 w-4" />
                              Anexo {index + 1}
                            </Button>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </CardFooter>
              </>
            )}
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}

function NegativeFeedbackTab() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [updatingFeedback, setUpdatingFeedback] = useState<string | null>(null);
  const [hidingFeedbacks, setHidingFeedbacks] = useState<string[]>([]);


  const feedbackQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'negativeFeedback'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: feedbacks, isLoading } = useCollection<NegativeFeedback>(feedbackQuery as any);

  const handleUpdateStatus = async (feedbackItem: NegativeFeedback, newStatus: 'reviewing' | 'fixed') => {
    if (!firestore || !user) return;
    setUpdatingFeedback(feedbackItem.id);
    
    const feedbackRef = doc(firestore, 'negativeFeedback', feedbackItem.id);
    const userFeedbackRef = doc(firestore, 'users', feedbackItem.userId, 'negativeFeedback', feedbackItem.id);
    const userRef = doc(firestore, 'users', feedbackItem.userId);

    try {
        const updatePayload = {
            status: newStatus,
            reviewedBy: user.email,
        };

        await updateDoc(feedbackRef, updatePayload);
        await setDoc(userFeedbackRef, {
            ...updatePayload, 
            question: feedbackItem.question,
            createdAt: feedbackItem.createdAt
        }, { merge: true });


        if (newStatus === 'fixed' && feedbackItem.status !== 'fixed') {
             // Use the dynamic points from the feedback document, or fallback to 1
            const pointsToAward = feedbackItem.reputationPointsAwarded || 1;
            await updateDoc(userRef, {
                reputationPoints: increment(pointsToAward)
            });
            
             // Start the 5-second timer to hide the card
            setTimeout(() => {
                setHidingFeedbacks(prev => [...prev, feedbackItem.id]);
            }, 5000);
        }

        toast({
            title: 'Status Atualizado!',
            description: `O feedback foi marcado como "${newStatus}".`,
        });

    } catch (error: any) {
        console.error("Erro ao atualizar status:", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar o status do feedback.' });
    } finally {
        setUpdatingFeedback(null);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'reviewing': return <Badge variant="secondary" className='bg-yellow-500/20 text-yellow-500 border-yellow-500/30'><Eye className="mr-1 h-3 w-3"/>Em Revisão</Badge>;
        case 'fixed': return <Badge variant="secondary" className='bg-green-500/20 text-green-500 border-green-500/30'><Check className="mr-1 h-3 w-3"/>Resolvido</Badge>;
        default: return <Badge variant="outline">Pendente</Badge>;
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Carregando feedbacks...</p>
      </div>
    );
  }

  const visibleFeedbacks = feedbacks?.filter(fb => !hidingFeedbacks.includes(fb.id));

  if (!visibleFeedbacks || visibleFeedbacks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-lg p-12 h-96">
        <Inbox className="h-16 w-16 mb-4" />
        <h2 className="text-2xl font-semibold">Nenhum Feedback Negativo</h2>
        <p className="mt-2">Quando os usuários marcarem respostas como negativas, elas aparecerão aqui para revisão.</p>
      </div>
    );
  }

  return (
     <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="space-y-6 pr-4">
        {visibleFeedbacks.map((feedback) => (
          <Card key={feedback.id} className={cn("transition-opacity duration-500", feedback.status === 'fixed' && 'opacity-50')}>
            <CardHeader className="flex flex-row items-start justify-between">
              <CardDescription className="flex items-center gap-2 text-xs">
                <User className="h-3 w-3" /> {feedback.userEmail || 'Usuário Anônimo'}
              </CardDescription>
               <div className='flex items-center gap-2'>
                {getStatusBadge(feedback.status)}
                <span className='text-xs text-muted-foreground'>{feedback.createdAt ? formatDistanceToNow(new Date(feedback.createdAt.seconds * 1000), { addSuffix: true, locale: ptBR }) : '...'}</span>
               </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary"/> Pergunta do Usuário</h3>
                <p className="text-sm p-4 bg-muted/50 rounded-md border">{feedback.question}</p>
              </div>
              <div className="space-y-2">
                 <h3 className="font-semibold flex items-center gap-2"><ThumbsDown className="h-4 w-4 text-destructive"/> Resposta Negativa da IA</h3>
                 <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-muted/50 rounded-md border" dangerouslySetInnerHTML={{ __html: micromark(feedback.negativeResponse) }} />
              </div>
              <Separator />
               <div className="space-y-2">
                 <h3 className="font-semibold flex items-center gap-2"><Bot className="h-4 w-4 text-primary"/> Sugestão de Melhoria (Gerada por IA)</h3>
                <p className="text-sm p-4 bg-primary/10 rounded-md border border-primary/20 text-primary-foreground/90">
                    {feedback.aiSuggestion} 
                    <span className='block mt-2 text-xs opacity-70'>(Pontos de Reputação Sugeridos: {feedback.reputationPointsAwarded || 1})</span>
                </p>
              </div>
            </CardContent>
            <CardFooter className='justify-end gap-2'>
                <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(feedback, 'reviewing')} disabled={updatingFeedback === feedback.id || feedback.status === 'reviewing' || feedback.status === 'fixed'}>
                    {updatingFeedback === feedback.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Eye className="h-4 w-4 text-yellow-500" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(feedback, 'fixed')} disabled={updatingFeedback === feedback.id || feedback.status === 'fixed'}>
                     {updatingFeedback === feedback.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4 text-green-500" />}
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}


function AdminSuggestionsPage() {
  return (
    <>
      <Head>
        <title>Revisão - Guia Eterno</title>
      </Head>
      <div className="space-y-6">
        <header className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight font-headline">Área de Revisão</h1>
            <p className="text-muted-foreground">Analise e gerencie o conteúdo e a qualidade das respostas.</p>
        </header>
        
        <Tabs defaultValue="suggestions">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="suggestions">Sugestões de Conteúdo</TabsTrigger>
            <TabsTrigger value="feedback">Respostas Negativas</TabsTrigger>
          </TabsList>
          <TabsContent value="suggestions">
            <ContentSuggestionsTab />
          </TabsContent>
          <TabsContent value="feedback">
            <NegativeFeedbackTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}


export default function SuggestionsPage() {
  const { isAdmin, isLoading } = useAdmin();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <ShieldAlert className="h-16 w-16 mb-4 text-destructive" />
        <h1 className="text-2xl font-bold">Acesso Negado</h1>
        <p className="text-muted-foreground mt-2">
          Você não tem permissão para acessar esta página.
        </p>
      </div>
    );
  }

  return <AdminSuggestionsPage />;
}

    