import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-6">Sobre o PixelFandom</h1>
      <div className="prose prose-invert space-y-4">
        <p>
          PixelFandom é uma plataforma multi-tenant de wikis, onde cada usuário
          pode criar sua própria wiki com domínio personalizado, assistente IA
          integrado e suporte a dados customizados.
        </p>
        <h2>Recursos</h2>
        <ul>
          <li>Crie sua wiki em segundos</li>
          <li>Domínio personalizado (próprio ou subdomínio Vercel)</li>
          <li>Editor de artigos com suporte a Markdown e JSON</li>
          <li>Assistente IA configurável por wiki</li>
          <li>Coleções de dados customizados</li>
          <li>Integração com Discord</li>
          <li>Controle de permissões por membros</li>
        </ul>
        <h2>Tecnologia</h2>
        <p>
          Construído com Next.js 15, Supabase (PostgreSQL), TipTap,
          OpenRouter AI e shadcn/ui.
        </p>
      </div>
      <div className="mt-8">
        <Link href="/" className="text-primary hover:underline">
          Voltar ao hub
        </Link>
      </div>
    </div>
  );
}
