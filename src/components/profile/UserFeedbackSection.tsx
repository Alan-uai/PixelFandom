'use client';

import { useUser, useFirebase, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Eye, ThumbsUp, HelpCircle } from 'lucide-react';

export function UserFeedbackSection() {
    const { user } = useUser();
    const { firestore } = useFirebase();

    const userFeedbackQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'users', user.uid, 'negativeFeedback'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user]);

    const { data: feedbacks, isLoading } = useCollection(userFeedbackQuery);
    
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'reviewing': return <Badge variant="secondary" className='bg-yellow-500/20 text-yellow-500 border-yellow-500/30'><Eye className="mr-1 h-3 w-3"/>Em Revisão</Badge>;
            case 'fixed': return <Badge variant="secondary" className='bg-green-500/20 text-green-500 border-green-500/30'><ThumbsUp className="mr-1 h-3 w-3"/>Resolvido</Badge>;
            default: return <Badge variant="outline">Pendente</Badge>;
        }
    };

    return (
        <Card className='lg:col-span-1'>
            <CardHeader>
                <CardTitle className='flex items-center gap-3'><HelpCircle /> Seus Feedbacks</CardTitle>
                <CardDescription>Acompanhe o status das respostas que você marcou como negativas.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && <div className='flex items-center justify-center'><Loader2 className='h-6 w-6 animate-spin'/></div>}
                {!isLoading && (!feedbacks || feedbacks.length === 0) && (
                    <p className='text-sm text-muted-foreground text-center'>Você ainda não marcou nenhuma resposta como negativa.</p>
                )}
                {!isLoading && feedbacks && feedbacks.length > 0 && (
                     <ScrollArea className="h-[200px] pr-4">
                        <div className="space-y-4">
                            {feedbacks.map(fb => (
                                <div key={fb.id} className="flex justify-between items-center p-3 rounded-md border bg-card">
                                    <p className="text-sm truncate pr-4">"{(fb as any).question}"</p>
                                    {getStatusBadge((fb as any).status || 'pending')}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    )
}
