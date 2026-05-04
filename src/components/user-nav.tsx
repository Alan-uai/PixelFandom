
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { useApp } from '@/context/app-provider';
import { LogIn, User } from 'lucide-react';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function UserNav() {
  const { user } = useUser();
  const { setAuthDialogOpen } = useApp();

  if (user && !user.isAnonymous) {
     return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link href="/profile" passHref>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full md:h-8 md:w-8">
                            <Avatar className="h-9 w-9 md:h-8 md:w-8">
                                <AvatarImage
                                    src={user?.photoURL ?? undefined}
                                    alt={user?.displayName ?? 'Avatar do usuário'}
                                />
                                <AvatarFallback>
                                <User />
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">Perfil</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
  }

  // Se não estiver logado ou for anônimo, o botão "Entrar" deve ser mostrado fora daqui.
  // Se retornarmos o botão aqui, ele aparecerá duplicado em alguns cenários.
  // Este componente agora só renderiza a UI do usuário logado.
  return null;
}
