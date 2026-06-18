import Link from 'next/link';

export default function SecurityPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">Segurança</h1>
      <p className="text-sm text-muted-foreground mb-8">Como protegemos seus dados e nossa plataforma</p>

      <div className="prose prose-invert space-y-6">
        <section>
          <h2>Infraestrutura Segura</h2>
          <p>
            O PixelFandom é construído sobre uma infraestrutura moderna e segura, utilizando provedores de classe mundial como Vercel e Supabase. Toda a comunicação entre seu navegador e nossos servidores é criptografada com TLS 1.3, garantindo que nenhum dado seja interceptado durante a transmissão.
          </p>
        </section>

        <section>
          <h2>Criptografia</h2>
          <ul>
            <li><strong>Em trânsito:</strong> TLS 1.3 para todas as conexões HTTP e WebSocket;</li>
            <li><strong>Em repouso:</strong> criptografia AES-256 para dados armazenados no banco de dados;</li>
            <li><strong>Chaves de API:</strong> criptografadas individualmente com AES-256-GCM utilizando chave derivada do <code>API_KEY_ENCRYPTION_SECRET</code>;</li>
            <li><strong>Senhas:</strong> não armazenamos senhas — utilizamos autenticação OAuth via Google e Discord.</li>
          </ul>
        </section>

        <section>
          <h2>Autenticação e Controle de Acesso</h2>
          <p>
            Utilizamos o Supabase Auth como provedor de identidade, com suporte a OAuth 2.0 (Google, Discord). As permissões são gerenciadas através de Row-Level Security (RLS) no PostgreSQL, garantindo que cada usuário tenha acesso apenas aos dados que lhe são autorizados.
          </p>
          <p>Os papéis são hierárquicos e granulares:</p>
          <ul>
            <li><strong>Owner</strong> — controle total sobre a wiki;</li>
            <li><strong>Admin</strong> — gerenciamento de membros e configurações;</li>
            <li><strong>Editor</strong> — criação e edição de conteúdo;</li>
            <li><strong>Viewer</strong> — acesso somente leitura.</li>
          </ul>
        </section>

        <section>
          <h2>Segurança contra Ameaças Comuns</h2>
          <ul>
            <li><strong>XSS (Cross-Site Scripting):</strong> todo conteúdo rich-text é sanitizado com DOMPurify antes da renderização;</li>
            <li><strong>SQL Injection:</strong> todas as queries utilizam parâmetros vinculados ou RPCs seguras do Supabase;</li>
            <li><strong>CSRF:</strong> proteção nativa através dos tokens de sessão do Supabase;</li>
            <li><strong>Prompt Injection:</strong> entradas do usuário para o sistema de IA são estritamente controladas — nenhum texto livre é inserido em prompts;</li>
            <li><strong>Clickjacking:</strong> headers X-Frame-Options configurados para prevenir incorporação não autorizada;</li>
            <li><strong>Content Injection:</strong> URLs e protocolos (javascript:, data:) são sanitizados em toda entrada de usuário.</li>
          </ul>
        </section>

        <section>
          <h2>Segurança da Conta</h2>
          <ul>
            <li>Autenticação exclusivamente via OAuth (Google, Discord) — sem senhas próprias;</li>
            <li>Sessões gerenciadas via tokens JWT seguros com renovação automática;</li>
            <li>Política CORS restritiva para prevenir requisições de origens não autorizadas.</li>
          </ul>
        </section>

        <section>
          <h2>Monitoramento e Auditoria</h2>
          <p>
            Monitoramos continuamente nossa infraestrutura para detectar atividades suspeitas. Mantemos logs de acesso e auditoria para investigação de incidentes. Notificações de segurança são enviadas imediatamente aos usuários afetados em caso de qualquer evento relevante.
          </p>
        </section>

        <section>
          <h2>Dependências e Atualizações</h2>
          <p>
            Mantemos nossas dependências atualizadas através de auditorias automatizadas (Dependabot) e revisões manuais periódicas. Vulnerabilidades conhecidas são tratadas com prioridade crítica e corrigidas dentro de prazos definidos por severidade.
          </p>
        </section>

        <section>
          <h2>Divulgação Responsável</h2>
          <p>
            Se você descobrir uma vulnerabilidade de segurança no PixelFandom, agradecemos sua cooperação em divulgá-la de forma responsável:
          </p>
          <ul>
            <li>Envie um e-mail para{' '}
              <a href="mailto:security@pixelfandom.com" className="text-primary hover:underline">security@pixelfandom.com</a>;
            </li>
            <li>Não explore a vulnerabilidade além do necessário para confirmá-la;</li>
            <li>Não divulgue publicamente até que tenhamos tido a oportunidade de corrigi-la;</li>
            <li>Não acesse, modifique ou exfiltre dados de outros usuários.</li>
          </ul>
          <p>
            Comprometemo-nos a responder em até 48 horas úteis e a trabalhar com você para resolver o problema. Reconhecemos contribuições de segurança em nossos agradecimentos (mediante autorização).
          </p>
        </section>

        <section>
          <h2>Contato de Segurança</h2>
          <p>
            Equipe de Segurança PixelFandom<br />
            <a href="mailto:security@pixelfandom.com" className="text-primary hover:underline">security@pixelfandom.com</a>
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
