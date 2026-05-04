
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateSolutionStream } from '@/ai/flows/generate-solution';
import { Bot, User, Send, Bookmark, Trash2, Zap, ThumbsUp, ThumbsDown, Settings2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/app-provider';
import type { Message, WikiArticle } from '@/lib/types';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { micromark } from 'micromark';
import { Card, CardContent } from './ui/card';
import { nanoid } from 'nanoid';
import { useUser, useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp, doc, setDoc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { analyzeNegativeFeedback } from '@/ai/flows/analyze-negative-feedback-flow';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { profileCategories } from '@/lib/profile-config';
import { Separator } from './ui/separator';
import { personas } from '@/lib/personas';
import { responseStyles } from '@/lib/response-styles';
import { emojiStyles } from '@/lib/emoji-styles';
import { officialLanguages } from '@/lib/official-languages';
import { funLanguages } from '@/lib/fun-languages';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const chatSchema = z.object({
  prompt: z.string().min(1, 'A pergunta não pode estar vazia.'),
});

interface ParsedSection {
  marcador: string;
  titulo: string;
  conteudo: string;
}

function renderStructuredContent(content: string, fromCache?: boolean) {
    let parsedContent: ParsedSection[] | null = null;
    let isJson = false;

    try {
        if (typeof content === 'string' && content.trim().startsWith('[')) {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed) && parsed.every(p => p.marcador && p.titulo && p.conteudo)) {
                parsedContent = parsed;
                isJson = true;
            }
        }
    } catch (e) {
      // Incomplete JSON during streaming is expected
    }

    if (!isJson && !parsedContent) {
        const cleanContent = content.replace(/\\"/g, '"').replace(/\\\\n/g, '\n').replace(/\\n/g, '\n');
        return (
            <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: micromark(cleanContent) }}
            />
        );
    }
    
    if (parsedContent && parsedContent.length > 0) {
        const introSection = parsedContent.find(s => s.marcador === 'texto_introdutorio');
        const accordionSections = parsedContent.filter(s => s.marcador === 'meio' || s.marcador === 'fim');
        const defaultAccordionItem = accordionSections.length > 0 ? 'item-0' : undefined;

        return (
            <div className='relative'>
                 {fromCache && (
                    <span className="absolute top-0 right-0 text-xs text-muted-foreground/70 flex items-center gap-1 z-10">
                    <Zap className='h-3 w-3' /> Instantâneo
                    </span>
                )}
                {introSection && (
                    <div
                        className="prose prose-sm dark:prose-invert max-w-none mb-4"
                        dangerouslySetInnerHTML={{ __html: micromark(introSection.conteudo) }}
                    />
                )}
                {accordionSections.length > 0 && (
                    <Accordion type="multiple" defaultValue={defaultAccordionItem ? [defaultAccordionItem] : []} className="w-full mt-4 border-t pt-4">
                        {accordionSections.map((section, index) => (
                            <AccordionItem value={`item-${index}`} key={index}>
                                <AccordionTrigger className="text-sm font-semibold hover:no-underline text-left">
                                    {section.titulo}
                                </AccordionTrigger>
                                <AccordionContent className="prose prose-sm dark:prose-invert max-w-none pl-6 pb-4">
                                    <div dangerouslySetInnerHTML={{ __html: micromark(section.conteudo) }} />
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </div>
        );
    }

    return null; // Return null if content is an empty JSON array string '[]'
}

function AssistantMessage({ message, fromCache }: { message: Message; fromCache?: boolean }) {
    const contentObj = typeof message.content === 'string' ? JSON.parse(message.content || '{}') : message.content;
    const { generalResponse, personalizedResponse } = contentObj as any;
    
    const generalContent = generalResponse ? renderStructuredContent(generalResponse, fromCache) : null;
    const personalizedContent = personalizedResponse ? renderStructuredContent(personalizedResponse, fromCache) : null;

    if (!generalContent && !personalizedContent) {
        return <TypingIndicator />;
    }

    return (
        <div>
            {generalContent && (
                 <div>
                    {personalizedContent && <h3 className="font-semibold text-foreground mb-2">Resposta Geral</h3>}
                    {generalContent}
      </div>
      )}

      <div className="border-t p-4 bg-background">
        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="text-muted-foreground"
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Configurações
            <ChevronDown className={cn("h-4 w-4 ml-2 transition-transform", showSettings && "rotate-180")} />
          </Button>
        </div>

        {showSettings && (
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label className="text-xs">Persona</Label>
              <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(personas).map(([key, value]: [string, any]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {value.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Estilo de Resposta</Label>
              <Select value={selectedResponseStyle} onValueChange={setSelectedResponseStyle}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(responseStyles).map(([key, value]: [string, any]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {value.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Idioma</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(allLanguages).map(([key, value]: [string, any]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {value.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Emojis</Label>
              <Select value={selectedEmojiStyle} onValueChange={setSelectedEmojiStyle}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(emojiStyles).map(([key, value]: [string, any]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {value.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-4">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Textarea
                      placeholder={isWikiLoading ? "Por favor espere, aprendendo com a wiki..." : "ex: Como eu derroto o Titã Sombrio?"}
                      className="resize-none"
                      {...field}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !isSendDisabled) {
                          e.preventDefault();
                          form.handleSubmit(onSubmit)();
                        }
                      }}
                      disabled={isSendDisabled}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" size="icon" disabled={isSendDisabled} className="bg-primary hover:bg-primary/90">
              <Send className="h-5 w-5" />
              <span className="sr-only">Enviar</span>
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
