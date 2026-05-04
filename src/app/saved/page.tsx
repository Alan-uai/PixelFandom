'use client';

import { useApp } from '@/context/app-provider';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Trash2, Inbox } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Head from 'next/head';
import { useUser } from '@/firebase';


export default function SavedAnswersPage() {
  const { savedAnswers, toggleSaveAnswer } = useApp();
  const { user } = useUser();

  const handleToggleSave = (answer: any) => {
    // Ensure we have a valid user and answer before proceeding
    if (user && answer) {
        toggleSaveAnswer(answer);
    }
  };

  return (
    <>
      <Head>
        <title>Respostas Salvas - Guia Eterno</title>
      </Head>
      <div className="space-y-6">
         <header className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight font-headline">Respostas Salvas</h1>
            <p className="text-muted-foreground">Sua coleção de soluções úteis do assistente de IA.</p>
        </header>
        
        {savedAnswers.length > 0 ? (
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="space-y-4 pr-4">
              {savedAnswers.map((answer) => (
                <Card key={answer.id}>
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                      <Bot className="h-6 w-6 text-primary" />
                      <CardTitle className="text-lg">Resposta da IA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{answer.content}</p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleToggleSave(answer)}
                      className="bg-accent/80 text-accent-foreground hover:bg-accent"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remover
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-lg p-12 h-96">
            <Inbox className="h-16 w-16 mb-4" />
            <h2 className="text-2xl font-semibold">Nenhuma Resposta Salva Ainda</h2>
            <p className="mt-2">Use o ícone de marcador no chat para salvar respostas úteis para mais tarde.</p>
          </div>
        )}
      </div>
    </>
  );
}
