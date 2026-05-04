'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, ShieldCheck, Gem, Flame, Coins, HelpCircle, ShoppingCart } from 'lucide-react';
import Head from 'next/head';

const mainObjectives = [
  'Pegar todos os phantoms/supremes de todas as ilhas.',
  'Completar os achievements.',
  'Completar o Index.',
  'Pegar acessórios de boss SS (capa/chinelo/chapéu/cachecol/máscara).',
  'Pegar joias de craft das dungeons (colar/anel/brinco).',
  'Maximizar todas as progressões de ilha.',
  'Completar o máximo possível de obeliscos.',
  'Pegar time full mítico/phantom da última ilha que você estiver.',
  'Pegar e evoluir as espadas do mundo 3, 5, 15 de energia.',
];

const energyGamepasses = ['Double Energy', 'Fast click', 'More Equips', 'Extra Champions Equips', 'Vip'];
const damageGamepasses = ['Double Damage', 'Double Weapon', 'Extra Titan'];
const utilityGamepasses = ['Fast Roll', 'Double Souls', 'Double Coins', 'Remote Access', 'Double Exp'];

const priorityOrder = [
    'Fast click',
    'Double Energy',
    'Double Damage',
    'Double Weapon',
    'Double Exp',
    'Fast Roll',
    'Extra Champions Equips',
    'More Equips',
    'Double Souls',
    'Vip',
    'Extra Stand',
    'Extra Titan',
];


export default function TipsPage() {
  return (
    <>
      <Head>
        <title>Como Ficar Mais Forte - Guia Eterno</title>
      </Head>
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Como Ficar Mais Forte
          </h1>
          <p className="text-muted-foreground">
            Um guia estratégico com objetivos e prioridades para otimizar sua progressão.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="text-primary" />
                Objetivos Principais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {mainObjectives.map((obj, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-1">&#x27A4;</span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="text-primary" />
                  Gamepasses por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2"><Gem size={18} className="text-blue-400"/>Energia</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {energyGamepasses.map(gp => <li key={gp}>- {gp}</li>)}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2"><Flame size={18} className="text-red-500"/>Dano</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {damageGamepasses.map(gp => <li key={gp}>- {gp}</li>)}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2"><Coins size={18} className="text-yellow-500"/>Utilidade</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {utilityGamepasses.map(gp => <li key={gp}>- {gp}</li>)}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="text-primary"/>
                        Ordem de Prioridade de Gamepass
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ol className="space-y-2">
                        {priorityOrder.map((item, index) => (
                             <li key={item} className="flex items-center gap-3 text-sm">
                                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 text-primary font-bold">{index + 1}</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ol>
                </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="text-primary"/>
                    Perguntas Frequentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold">Compensa comprar Exclusive Stars?</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Não compensa. É muito melhor comprar o Starter Pack #1 por 300 créditos, que já vem com o avatar top e 1 pet bom.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
