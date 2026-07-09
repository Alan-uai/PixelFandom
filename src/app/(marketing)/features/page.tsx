import Link from 'next/link';

export default function FeaturesPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">Recursos</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Tudo que você precisa para criar e gerenciar sua wiki
      </p>

      <div className="prose prose-invert space-y-6">
        <section>
          <h2>Criação de Wiki Instantânea</h2>
          <p>
            Crie sua wiki em segundos. Escolha um nome, defina uma descrição e
            pronto — sua wiki já está no ar com um subdomínio próprio. Sem
            configurações complexas, sem servidores para gerenciar.
          </p>
        </section>

        <section>
          <h2>Domínio Personalizado</h2>
          <p>
            Use seu próprio domínio (ex: wiki.meujogo.com) ou um subdomínio
            Vercel gratuito. O DNS é configurado automaticamente com suporte a
            SSL/TLS via Vercel, garantindo uma conexão segura para todos os
            visitantes.
          </p>
        </section>

        <section>
          <h2>Editor de Artigos</h2>
          <p>
            Editor rich-text completo com suporte a Markdown, imagens, tabelas e
            formatação avançada. Crie artigos organizados com categorias, tags e
            uma árvore de páginas que facilita a navegação.
          </p>
          <ul>
            <li>Formatação rich-text com TipTap</li>
            <li>Suporte a Markdown e JSON</li>
            <li>Upload de imagens integrado</li>
            <li>Links entre páginas da wiki</li>
            <li>Histórico de versões</li>
          </ul>
        </section>

        <section>
          <h2>Assistente IA</h2>
          <p>
            Cada wiki conta com um assistente de IA configurável. Seus membros
            podem fazer perguntas sobre o conteúdo da wiki, obter resumos e
            receber ajuda personalizada — tudo baseado no conhecimento da sua
            comunidade.
          </p>
          <ul>
            <li>Respostas baseadas no conteúdo da wiki</li>
            <li>Personalidade e tom configuráveis</li>
            <li>Suporte a múltiplos provedores (OpenRouter, Gemini)</li>
            <li>Chat em tempo real</li>
          </ul>
        </section>

        <section>
          <h2>Dados Customizados</h2>
          <p>
            Crie tabelas e coleções de dados dentro da sua wiki sem precisar de
            banco de dados externo. Perfeito para armazenar informações
            estruturadas como fichas de personagens, itens, habilidades, mapas
            e muito mais.
          </p>
          <ul>
            <li>Tabelas customizadas com tipos dinâmicos</li>
            <li>Tradução automática de termos</li>
            <li>Integração com o editor de artigos</li>
            <li>Exportação de dados</li>
          </ul>
        </section>

        <section>
          <h2>Integração com Discord</h2>
          <p>
            Conecte sua wiki ao Discord e automatize a publicação de conteúdo,
            sincronize cargos de membros e receba notificações de atualizações
            diretamente no seu servidor.
          </p>
          <ul>
            <li>Auto-post de códigos, artigos e atualizações</li>
            <li>Sincronização de cargos (membro, editor, admin)</li>
            <li>Chat da wiki integrado ao Discord</li>
            <li>Comandos personalizados</li>
          </ul>
        </section>

        <section>
          <h2>Controle de Acesso</h2>
          <p>
            Gerencie quem pode ver, editar e administrar sua wiki com um sistema
            de permissões hierárquico e granular.
          </p>
          <ul>
            <li><strong>Owner:</strong> controle total</li>
            <li><strong>Admin:</strong> gerencia membros e configurações</li>
            <li><strong>Editor:</strong> cria e edita conteúdo</li>
            <li><strong>Viewer:</strong> acesso somente leitura</li>
          </ul>
        </section>

        <section>
          <h2>Páginas Customizadas</h2>
          <p>
            Monte páginas da sua wiki com blocos pré-definidos — hero, grid de
            artigos, galeria de imagens, tabelas, lista de recursos, rich text
            e dezenas de outros tipos. Tudo sem escrever uma linha de código.
          </p>
        </section>

        <section>
          <h2>Segurança e Confiabilidade</h2>
          <ul>
            <li>Criptografia TLS 1.3 em todas as conexões</li>
            <li>Dados criptografados em repouso (AES-256)</li>
            <li>Autenticação via Google e Discord (OAuth)</li>
            <li>Sanitização automática de conteúdo HTML</li>
            <li>Infraestrutura escalável na Vercel + Supabase</li>
          </ul>
        </section>
      </div>

      <div className="mt-10 pt-6 border-t border-border/30">
        <Link href="/" className="text-primary hover:underline text-sm">
          ← Voltar ao hub
        </Link>
      </div>
    </div>
  );
}
