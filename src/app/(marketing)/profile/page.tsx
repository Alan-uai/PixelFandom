'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/supabase';
import { Loader2, User, Eye } from 'lucide-react';
import ProfileEditor from '@/components/profile/profile-editor';
import ProfileView from '@/components/profile/profile-view';

export default function ProfilePage() {
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/');
        return;
      }
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 pt-10">
      <Tabs defaultValue="view" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="view" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Perfil Público
          </TabsTrigger>
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Editar Perfil
          </TabsTrigger>
        </TabsList>
        <TabsContent value="view" className="mt-6">
          <ProfileView />
        </TabsContent>
        <TabsContent value="edit" className="mt-6">
          <ProfileEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
