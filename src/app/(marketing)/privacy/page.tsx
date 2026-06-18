import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
      <p className="text-sm text-muted-foreground mb-8">Última atualização: 18 de junho de 2026</p>

      <div className="prose prose-invert space-y-6">
        <section>
          <h2>1. Introdução</h2>
          <p>
            O PixelFandom ("nós", "nosso") respeita sua privacidade e está comprometido em proteger os dados pessoais que você compartilha conosco. Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos suas informações.
          </p>
        </section>

        <section>
          <h2>2. Dados Coletados</h2>
          <p>Podemos coletar os seguintes tipos de dados:</p>
          <ul>
            <li><strong>Dados de cadastro:</strong> nome, e-mail, foto do perfil, provedor de autenticação (Google, Discord);</li>
            <li><strong>Dados de uso:</strong> páginas visitadas, recursos acessados, preferências de configuração;</li>
            <li><strong>Dados de conteúdo:</strong> artigos, imagens e metadados inseridos em sua wiki;</li>
            <li><strong>Dados de dispositivo:</strong> endereço IP, agente do usuário, tipo de navegador;</li>
            <li><strong>Cookies:</strong> conforme detalhado em nossa{' '}
              <Link href="/cookies" className="text-primary hover:underline">Política de Cookies</Link>.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. Finalidade do Tratamento</h2>
          <p>Utilizamos seus dados para:</p>
          <ul>
            <li>Fornecer, manter e melhorar a Plataforma;</li>
            <li>Autenticar sua identidade e autorizar acesso;</li>
            <li>Personalizar sua experiência e recomendações;</li>
            <li>Comunicar atualizações, avisos de segurança e alterações nos Termos;</li>
            <li>Analisar padrões de uso para otimizar a infraestrutura;</li>
            <li>Cumprir obrigações legais e regulatórias.</li>
          </ul>
        </section>

        <section>
          <h2>4. Base Legal (LGPD)</h2>
          <p>
            De acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018), tratamos seus dados com base nas seguintes hipóteses legais:
          </p>
          <ul>
            <li>Mediante seu consentimento (art. 7º, I);</li>
            <li>Para execução de contrato (art. 7º, V);</li>
            <li>Para cumprimento de obrigação legal (art. 7º, II);</li>
            <li>Para legítimo interesse (art. 7º, IX).</li>
          </ul>
        </section>

        <section>
          <h2>5. Compartilhamento de Dados</h2>
          <p>
            Não vendemos seus dados pessoais. Podemos compartilhar dados com:
          </p>
          <ul>
            <li>Provedores de infraestrutura (Vercel, Supabase) — estritamente para operação do serviço;</li>
            <li>Provedores de autenticação (Google, Discord) — conforme sua escolha de login;</li>
            <li>Autoridades legais — quando exigido por lei.</li>
          </ul>
        </section>

        <section>
          <h2>6. Armazenamento e Segurança</h2>
          <p>
            Seus dados são armazenados em servidores seguros com criptografia em trânsito (TLS 1.3) e em repouso (AES-256). Implementamos controles de acesso rigorosos e realizamos auditorias periódicas de segurança para proteger suas informações.
          </p>
        </section>

        <section>
          <h2>7. Seus Direitos (LGPD)</h2>
          <p>Você tem direito a:</p>
          <ul>
            <li>Confirmar a existência de tratamento de seus dados;</li>
            <li>Acessar seus dados pessoais;</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
            <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;</li>
            <li>Portar seus dados a outro fornecedor;</li>
            <li>Eliminar dados tratados com seu consentimento;</li>
            <li>Revogar seu consentimento a qualquer tempo.</li>
          </ul>
          <p>
            Para exercer seus direitos, entre em contato pelo e-mail{' '}
            <a href="mailto:privacy@pixelfandom.com" className="text-primary hover:underline">privacy@pixelfandom.com</a>.
          </p>
        </section>

        <section>
          <h2>8. Retenção de Dados</h2>
          <p>
            Mantemos seus dados pelo tempo necessário para fornecer a Plataforma ou até que você solicite a exclusão. Dados anonimizados podem ser retidos por período indeterminado para fins estatísticos.
          </p>
        </section>

        <section>
          <h2>9. Transferência Internacional</h2>
          <p>
            Seus dados podem ser processados em servidores localizados fora do Brasil. Garantimos que tais transferências ocorrem em conformidade com a LGPD, mediante cláusulas contratuais adequadas.
          </p>
        </section>

        <section>
          <h2>10. Alterações</h2>
          <p>
            Esta política pode ser atualizada periodicamente. Notificaremos sobre alterações significativas através da Plataforma ou por e-mail.
          </p>
        </section>

        <section>
          <h2>11. Contato do DPO</h2>
          <p>
            Para questões de privacidade, entre em contato com nosso Encarregado (DPO):<br />
            <a href="mailto:dpo@pixelfandom.com" className="text-primary hover:underline">dpo@pixelfandom.com</a>
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
