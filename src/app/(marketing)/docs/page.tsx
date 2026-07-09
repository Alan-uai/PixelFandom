import Link from 'next/link';

const sections = [
  {
    title: 'Primeiros Passos',
    items: [
      { label: 'Criando sua wiki', href: '/docs/criando-wiki' },
      { label: 'Configurando o domínio', href: '/docs/dominio' },
      { label: 'Convidando membros', href: '/docs/membros' },
      { label: 'Entendendo as permissões', href: '/docs/permissoes' },
    ],
  },
  {
    title: 'Editor de Conteúdo',
    items: [
      { label: 'Criando artigos', href: '/docs/criando-artigos' },
      { label: 'Formatando texto', href: '/docs/formatacao' },
      { label: 'Imagens e mídia', href: '/docs/midia' },
      { label: 'Links entre páginas', href: '/docs/links' },
    ],
  },
  {
    title: 'Dados Customizados',
    items: [
      { label: 'Criando tabelas', href: '/docs/criando-tabelas' },
      { label: 'Tipos de coluna', href: '/docs/tipos-coluna' },
      { label: 'Tradução automática', href: '/docs/traducao' },
    ],
  },
  {
    title: 'Assistente IA',
    items: [
      { label: 'Configurando o assistente', href: '/docs/config-ia' },
      { label: 'Personalidade e tom', href: '/docs/personalidade-ia' },
      { label: 'Provedores suportados', href: '/docs/provedores-ia' },
    ],
  },
  {
    title: 'Integrações',
    items: [
      { label: 'Discord', href: '/docs/discord' },
      { label: 'API', href: '/docs/api' },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">Documentação</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Guias, tutoriais e referências para aproveitar o PixelFandom ao máximo
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-xl border border-border/30 bg-black/20 p-5"
          >
            <h2 className="text-lg font-semibold mb-3">{section.title}</h2>
            <ul className="space-y-2">
              {section.items.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Em Busca de Ajuda?</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Se você não encontrou o que procurava, existem outras formas de obter
          ajuda:
        </p>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>
            💬 Entre no nosso{' '}
            <Link
              href="https://discord.gg/pixelfandom"
              className="text-primary hover:underline"
            >
              Discord
            </Link>{' '}
            para conversar com a comunidade
          </li>
          <li>
            📧 Envie um email para{' '}
            <a
              href="mailto:suporte@pixelfandom.com"
              className="text-primary hover:underline"
            >
              suporte@pixelfandom.com
            </a>
          </li>
          <li>
            🐛 Reporte bugs no{' '}
            <Link
              href="https://github.com/pixelfandom"
              className="text-primary hover:underline"
            >
              GitHub
            </Link>
          </li>
        </ul>
      </section>

      <div className="mt-10 pt-6 border-t border-border/30">
        <Link href="/" className="text-primary hover:underline text-sm">
          ← Voltar ao hub
        </Link>
      </div>
    </div>
  );
}
