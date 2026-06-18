import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">Termos de Serviço</h1>
      <p className="text-sm text-muted-foreground mb-8">Última atualização: 18 de junho de 2026</p>

      <div className="prose prose-invert space-y-6">
        <section>
          <h2>1. Aceitação dos Termos</h2>
          <p>
            Ao acessar ou usar a plataforma PixelFandom ("Plataforma"), você confirma que leu, entendeu e concorda em ficar vinculado a estes Termos de Serviço ("Termos"). Se você não concordar com qualquer parte destes Termos, não utilize a Plataforma.
          </p>
        </section>

        <section>
          <h2>2. Definições</h2>
          <ul>
            <li><strong>Plataforma:</strong> PixelFandom, serviço multi-tenant de criação e gerenciamento de wikis.</li>
            <li><strong>Usuário:</strong> qualquer pessoa física que acesse ou utilize a Plataforma.</li>
            <li><strong>Criador:</strong> usuário que cria e administra uma wiki na Plataforma.</li>
            <li><strong>Membro:</strong> usuário convidado a colaborar em uma wiki.</li>
            <li><strong>Conteúdo:</strong> todo texto, imagem, dado ou material inserido na Plataforma.</li>
          </ul>
        </section>

        <section>
          <h2>3. Cadastro e Conta</h2>
          <p>
            Para utilizar certos recursos da Plataforma, é necessário criar uma conta. Você é responsável por manter a confidencialidade de suas credenciais e por todas as atividades ocorridas em sua conta. Você deve nos informar imediatamente sobre qualquer uso não autorizado.
          </p>
        </section>

        <section>
          <h2>4. Uso da Plataforma</h2>
          <p>Você concorda em utilizar a Plataforma apenas para fins legais e de acordo com estes Termos. É proibido:</p>
          <ul>
            <li>Violar leis ou regulamentos aplicáveis;</li>
            <li>Publicar conteúdo ilegal, difamatório, obsceno ou fraudulento;</li>
            <li>Interferir na operação da Plataforma ou sobrecarregar sua infraestrutura;</li>
            <li>Tentar acessar áreas restritas sem autorização;</li>
            <li>Utilizar a Plataforma para enviar spam ou malware.</li>
          </ul>
        </section>

        <section>
          <h2>5. Propriedade Intelectual</h2>
          <p>
            A Plataforma, incluindo seu código, design, logotipos e funcionalidades, é de propriedade exclusiva do PixelFandom. O conteúdo inserido por usuários permanece de propriedade de seus respectivos criadores, que concedem ao PixelFandom uma licença para armazenar e exibir tal conteúdo na Plataforma.
          </p>
        </section>

        <section>
          <h2>6. Limitação de Responsabilidade</h2>
          <p>
            O PixelFandom não se responsabiliza por danos diretos, indiretos, incidentais ou consequenciais decorrentes do uso ou da impossibilidade de uso da Plataforma. A Plataforma é fornecida "como está", sem garantias de qualquer tipo, expressas ou implícitas.
          </p>
        </section>

        <section>
          <h2>7. Rescisão</h2>
          <p>
            Podemos suspender ou encerrar sua conta a qualquer momento, sem aviso prévio, se considerarmos que você violou estes Termos ou agiu de maneira prejudicial à Plataforma ou a outros usuários. Você pode encerrar sua conta a qualquer momento através das configurações.
          </p>
        </section>

        <section>
          <h2>8. Alterações</h2>
          <p>
            Reservamo-nos o direito de modificar estes Termos a qualquer momento. Alterações significativas serão comunicadas através da Plataforma. O uso continuado após as alterações constitui aceitação dos novos Termos.
          </p>
        </section>

        <section>
          <h2>9. Legislação Aplicável</h2>
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será resolvida no foro da comarca de São Paulo, SP.
          </p>
        </section>

        <section>
          <h2>10. Contato</h2>
          <p>
            Para questões relacionadas a estes Termos, entre em contato pelo e-mail{' '}
            <a href="mailto:legal@pixelfandom.com" className="text-primary hover:underline">legal@pixelfandom.com</a>.
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
