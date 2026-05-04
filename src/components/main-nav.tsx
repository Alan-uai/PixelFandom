
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BotMessageSquare, Bookmark, Lightbulb, ClipboardList, BrainCircuit, Database, User, LogOut, HeartPulse, LogIn } from 'lucide-react';
import { useAdmin } from '@/hooks/use-admin';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { UserNav } from './user-nav';
import { useApp } from '@/context/app-provider';

const navItems = [
  { href: '/', icon: BotMessageSquare, label: 'Chat IA' },
  { href: '/tips', icon: HeartPulse, label: 'Dicas' },
  { href: '/saved', icon: Bookmark, label: 'Salvas' },
  { href: '/suggest', icon: Lightbulb, label: 'Sugerir' },
];

const adminNavItems = [
    { href: '/suggestions', icon: ClipboardList, label: 'Sugestões' },
    { href: '/admin/manage-content', icon: Database, label: 'Gerenciar' },
    { href: '/admin-chat', icon: BrainCircuit, label: 'Canal IA' },
];

export function MainNav() {
  const pathname = usePathname();
  const { isAdmin } = useAdmin();
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const { setAuthDialogOpen } = useApp();


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


  return (
    <TooltipProvider>
      <nav className="flex w-full items-center gap-2">
        <div className="flex-1 flex justify-center gap-2">
            {navItems.map((item) => (
            <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                <Link
                    href={item.href}
                    className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                    pathname === item.href && 'bg-accent text-accent-foreground'
                    )}
                >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">{item.label}</TooltipContent>
            </Tooltip>
            ))}
            
            {isAdmin && adminNavItems.map((item) => (
            <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                <Link
                    href={item.href}
                    className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                    pathname.startsWith(item.href) && 'bg-accent text-accent-foreground'
                    )}
                >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">{item.label}</TooltipContent>
            </Tooltip>
            ))}
        </div>
        
        <div className='flex items-center gap-2'>
            {user && !user.isAnonymous ? (
            <>
                <Tooltip>
                <TooltipTrigger asChild>
                    <Button onClick={handleSignOut} variant="ghost" size="icon" className='h-9 w-9 md:h-8 md:w-8 text-muted-foreground hover:text-foreground'>
                        <LogOut className="h-5 w-5" />
                        <span className="sr-only">Sair</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Sair</TooltipContent>
                </Tooltip>
                <UserNav />
            </>
            ) : (
                <Button variant="outline" onClick={() => setAuthDialogOpen(true)}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Entrar
                </Button>
            )}
        </div>
      </nav>
    </TooltipProvider>
  );
}
