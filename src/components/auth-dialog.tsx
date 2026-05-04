'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useApp } from '@/context/app-provider';
import { useAuth } from '@/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';
import { Github } from 'lucide-react';
import { handleUserLogin } from '@/lib/auth-actions';
import { useRouter } from 'next/navigation';

const signUpSchema = z
  .object({
    email: z.string().email('Email inválido.'),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  });

const signInSchema = z.object({
  email: z.string().email('Email inválido.'),
  password: z.string().min(1, 'A senha é obrigatória.'),
});

export function AuthDialog() {
  const { isAuthDialogOpen, setAuthDialogOpen } = useApp();
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleAuthError = (error: any) => {
    let title = 'Erro de autenticação';
    let description = 'Ocorreu um erro desconhecido. Tente novamente.';
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          title = 'Email já em uso';
          description = 'Este endereço de e-mail já está associado a uma conta.';
          break;
        case 'auth/wrong-password':
          title = 'Senha incorreta';
          description = 'A senha que você digitou está incorreta. Verifique e tente novamente.';
          break;
        case 'auth/user-not-found':
          title = 'Usuário não encontrado';
          description = 'Não foi encontrada nenhuma conta com este endereço de e-mail.';
          break;
        case 'auth/credential-already-in-use':
            title = 'Credencial já em uso';
            description = 'Esta conta do Google já está associada a outro usuário.';
            break;
        case 'auth/cancelled-popup-request':
        case 'auth/popup-closed-by-user':
            // Não mostra toast para pop-ups cancelados pelo usuário
            return;
        default:
          title = `Erro: ${error.code}`;
          description = error.message;
          break;
      }
    }
    toast({ variant: 'destructive', title, description });
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      // A chamada para handleUserLogin é agora tratada pelo onAuthStateChanged no provider
      await signInWithPopup(auth, provider);
      setAuthDialogOpen(false);
      toast({ title: 'Login bem-sucedido!', description: 'Você entrou com sua conta do Google.' });
    } catch (error) {
      handleAuthError(error);
    }
  };

  async function onSignUp(values: z.infer<typeof signUpSchema>) {
    if (!auth) return;
    try {
        let isNewUserFlow = false;
        if (auth.currentUser && auth.currentUser.isAnonymous) {
            const credential = EmailAuthProvider.credential(values.email, values.password);
            await linkWithCredential(auth.currentUser, credential);
        } else {
            await createUserWithEmailAndPassword(auth, values.email, values.password);
            isNewUserFlow = true;
        }
      setAuthDialogOpen(false);
      toast({ title: 'Conta criada!', description: 'Sua conta foi criada com sucesso.' });
      
      if(isNewUserFlow){
          router.push('/profile?new-user=true');
      }

    } catch (error) {
      handleAuthError(error);
    }
  }

  async function onSignIn(values: z.infer<typeof signInSchema>) {
    if (!auth) return;
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      setAuthDialogOpen(false);
      toast({ title: 'Login bem-sucedido!', description: 'Bem-vindo de volta.' });
    } catch (error) {
      handleAuthError(error);
    }
  }

  return (
    <Dialog open={isAuthDialogOpen} onOpenChange={setAuthDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Autenticação</DialogTitle>
          <DialogDescription>
            Entre ou crie uma conta para salvar seu progresso.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar Conta</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <div className="space-y-4 py-4">
              <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.242,44,30.038,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                </svg>
                Entrar com o Google
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou continue com
                  </span>
                </div>
              </div>
              <Form {...signInForm}>
                <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
                  <FormField
                    control={signInForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signInForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="********" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Entrar
                  </Button>
                </form>
              </Form>
            </div>
          </TabsContent>
          <TabsContent value="signup">
          <div className="space-y-4 py-4">
              <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                 <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.242,44,30.038,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                </svg>
                Criar conta com o Google
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou continue com
                  </span>
                </div>
              </div>
              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="********" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="********" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Criar Conta
                  </Button>
                </form>
              </Form>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

    