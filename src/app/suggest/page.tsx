'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { FloatingLabelTextarea } from '@/components/ui/floating-label-textarea';
import { useState } from 'react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';

export default function Suggest() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('content_suggestions')
        .insert({
          title,
          content,
          user_id: user?.id || null,
          user_email: user?.email || null,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: 'Sugestão enviada!',
        description: 'Obrigado! Sua sugestão será revisada pela equipe.',
      });

      setTitle('');
      setContent('');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar',
        description: err.message || 'Tente novamente mais tarde.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6">Suggest Wiki Content</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <FloatingLabelInput
                label="Title"
                info="A short title for your suggestion"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <FloatingLabelTextarea
                label="Content"
                info="Describe your suggestion in detail"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[150px]"
                required
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Submit Suggestion'}
              </Button>
            </motion.div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
