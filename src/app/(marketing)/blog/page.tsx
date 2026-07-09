import Link from 'next/link';

const posts = [
  {
    title: 'PixelFandom agora suporta domínios personalizados',
    date: '15 de Junho, 2026',
    excerpt:
      'Agora você pode usar seu próprio domínio na sua wiki. Configuração simplificada com SSL automático via Vercel.',
    slug: 'dominios-personalizados',
  },
  {
    title: 'Novo editor de artigos com TipTap',
    date: '2 de Junho, 2026',
    excerpt:
      'O editor foi totalmente reformulado com TipTap, trazendo suporte a Markdown, blocos dinâmicos e uma experiência de escrita muito mais fluida.',
    slug: 'editor-tiptap',
  },
  {
    title: 'Assistente IA agora com Gemini e OpenRouter',
    date: '20 de Maio, 2026',
    excerpt:
      'Sistema de IA híbrido: cada wiki pode escolher entre OpenRouter e Gemini, com personalidade e tom configuráveis.',
    slug: 'assistente-ia-dual',
  },
  {
    title: 'Integração com Discord está no ar',
    date: '5 de Maio, 2026',
    excerpt:
      'Conecte sua wiki ao Discord e automatize a publicação de conteúdo, sincronize cargos e muito mais.',
    slug: 'integracao-discord',
  },
  {
    title: 'Dados customizados: tabelas dinâmicas na sua wiki',
    date: '18 de Abril, 2026',
    excerpt:
      'Crie tabelas e coleções de dados dentro da sua wiki sem precisar de banco de dados externo.',
    slug: 'dados-customizados',
  },
  {
    title: 'PixelFandom: o que é e como começar',
    date: '1 de Abril, 2026',
    excerpt:
      'PixelFandom é a plataforma multi-tenant de wikis para comunidades de jogos, fandoms e muito mais. Saiba como criar sua wiki em segundos.',
    slug: 'comecando',
  },
];

export default function BlogPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">Blog</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Novidades, atualizações e artigos sobre o PixelFandom
      </p>

      <div className="space-y-6">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="rounded-xl border border-border/30 bg-black/20 p-5 hover:bg-black/30 hover:border-border/50 transition-all duration-300"
          >
            <time className="text-xs text-muted-foreground">{post.date}</time>
            <h2 className="text-lg font-semibold mt-1 mb-2">
              <Link
                href={`/blog/${post.slug}`}
                className="hover:text-primary transition-colors"
              >
                {post.title}
              </Link>
            </h2>
            <p className="text-sm text-muted-foreground">{post.excerpt}</p>
            <Link
              href={`/blog/${post.slug}`}
              className="inline-block mt-3 text-xs font-medium text-primary hover:underline"
            >
              Ler mais →
            </Link>
          </article>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-border/30">
        <Link href="/" className="text-primary hover:underline text-sm">
          ← Voltar ao hub
        </Link>
      </div>
    </div>
  );
}
