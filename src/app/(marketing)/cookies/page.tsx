import Link from 'next/link';

export default function CookiesPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">Política de Cookies</h1>
      <p className="text-sm text-muted-foreground mb-8">Última atualização: 18 de junho de 2026</p>

      <div className="prose prose-invert space-y-6">
        <section>
          <h2>1. O que são Cookies?</h2>
          <p>
            Cookies são pequenos arquivos de texto armazenados em seu navegador quando você visita um site. Eles permitem que o site reconheça seu dispositivo e armazene informações sobre suas preferências e navegação.
          </p>
        </section>

        <section>
          <h2>2. Como Utilizamos Cookies</h2>
          <p>O PixelFandom utiliza cookies para as seguintes finalidades:</p>
          <ul>
            <li><strong>Essenciais:</strong> necessários para o funcionamento básico da Plataforma, como autenticação e segurança da sessão;</li>
            <li><strong>Preferências:</strong> armazenam suas escolhas (idioma, tema, configurações) para proporcionar uma experiência personalizada;</li>
            <li><strong>Analíticos:</strong> coletam dados anônimos de uso para nos ajudar a entender como a Plataforma é utilizada e identificar áreas de melhoria;</li>
            <li><strong>Autenticação:</strong> gerenciam sua sessão de login e lembram que você está autenticado.</li>
          </ul>
        </section>

        <section>
          <h2>3. Cookies que Utilizamos</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 pr-4 font-semibold">Cookie</th>
                  <th className="text-left py-2 pr-4 font-semibold">Tipo</th>
                  <th className="text-left py-2 pr-4 font-semibold">Finalidade</th>
                  <th className="text-left py-2 font-semibold">Duração</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/20">
                  <td className="py-2 pr-4 font-mono text-xs">sb-access-token</td>
                  <td className="py-2 pr-4">Essencial</td>
                  <td className="py-2 pr-4">Autenticação Supabase</td>
                  <td className="py-2">Sessão</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-2 pr-4 font-mono text-xs">sb-refresh-token</td>
                  <td className="py-2 pr-4">Essencial</td>
                  <td className="py-2 pr-4">Renovação de sessão</td>
                  <td className="py-2">30 dias</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-2 pr-4 font-mono text-xs">x-tenant-slug</td>
                  <td className="py-2 pr-4">Essencial</td>
                  <td className="py-2 pr-4">Identificação do tenant</td>
                  <td className="py-2">Sessão</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-2 pr-4 font-mono text-xs">pf_splash</td>
                  <td className="py-2 pr-4">Preferência</td>
                  <td className="py-2 pr-4">Controle da splash screen</td>
                  <td className="py-2">Persistente</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>4. Cookies de Terceiros</h2>
          <p>
            Utilizamos serviços de terceiros que podem definir cookies em seu navegador:
          </p>
          <ul>
            <li><strong>Supabase:</strong> cookies de autenticação e sessão;</li>
            <li><strong>Vercel:</strong> cookies de infraestrutura e analytics.</li>
          </ul>
          <p>
            Não utilizamos cookies de publicidade ou rastreamento comportamental.
          </p>
        </section>

        <section>
          <h2>5. Gerenciamento de Cookies</h2>
          <p>
            Você pode controlar e/ou excluir cookies conforme sua preferência. A maioria dos navegadores permite gerenciar cookies através das configurações:
          </p>
          <ul>
            <li><strong>Chrome:</strong> Configurações → Privacidade e segurança → Cookies e outros dados do site;</li>
            <li><strong>Firefox:</strong> Opções → Privacidade e segurança → Cookies e dados de sites;</li>
            <li><strong>Safari:</strong> Preferências → Privacidade → Cookies e dados de sites;</li>
            <li><strong>Edge:</strong> Configurações → Cookies e permissões do site → Cookies e dados armazenados.</li>
          </ul>
          <p>
            A desativação de cookies essenciais pode afetar o funcionamento da Plataforma.
          </p>
        </section>

        <section>
          <h2>6. Consentimento</h2>
          <p>
            Ao continuar navegando na Plataforma após ser informado sobre nossa Política de Cookies, você consente com o uso de cookies conforme descrito neste documento. Você pode retirar seu consentimento a qualquer momento ajustando as configurações do seu navegador.
          </p>
        </section>

        <section>
          <h2>7. Contato</h2>
          <p>
            Para dúvidas sobre nossa Política de Cookies, entre em contato pelo e-mail{' '}
            <a href="mailto:privacy@pixelfandom.com" className="text-primary hover:underline">privacy@pixelfandom.com</a>.
          </p>
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
