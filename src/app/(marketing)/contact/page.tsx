import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">Contato</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Entre em contato com a equipe PixelFandom
      </p>

      <div className="prose prose-invert space-y-6">
        <section>
          <h2>Canais de Atendimento</h2>
          <p>
            Escolha o canal mais adequado para sua necessidade. Respondemos o
            mais rápido possível em todos eles.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
            <div className="rounded-xl border border-border/30 bg-black/20 p-5">
              <h3 className="text-base font-semibold mb-2">💬 Discord</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Comunidade ativa, suporte rápido e discussões técnicas.
              </p>
              <Link
                href="https://discord.gg/pixelfandom"
                className="text-sm text-primary hover:underline"
              >
                Entrar no Discord →
              </Link>
            </div>

            <div className="rounded-xl border border-border/30 bg-black/20 p-5">
              <h3 className="text-base font-semibold mb-2">📧 Email</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Para questões formais, parcerias e suporte avançado.
              </p>
              <a
                href="mailto:contato@pixelfandom.com"
                className="text-sm text-primary hover:underline"
              >
                contato@pixelfandom.com →
              </a>
            </div>

            <div className="rounded-xl border border-border/30 bg-black/20 p-5">
              <h3 className="text-base font-semibold mb-2">🐛 Reportar Bug</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Encontrou um bug? Reporte no GitHub Issues.
              </p>
              <Link
                href="https://github.com/pixelfandom"
                className="text-sm text-primary hover:underline"
              >
                GitHub Issues →
              </Link>
            </div>

            <div className="rounded-xl border border-border/30 bg-black/20 p-5">
              <h3 className="text-base font-semibold mb-2">🔒 Segurança</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Vulnerabilidades de segurança devem ser reportadas por email.
              </p>
              <a
                href="mailto:security@pixelfandom.com"
                className="text-sm text-primary hover:underline"
              >
                security@pixelfandom.com →
              </a>
            </div>
          </div>
        </section>

        <section>
          <h2>Tempos de Resposta</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 pr-4 font-semibold">Canal</th>
                  <th className="text-left py-2 pr-4 font-semibold">
                    Tempo médio
                  </th>
                  <th className="text-left py-2 font-semibold">Horário</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/20">
                  <td className="py-2 pr-4">Discord</td>
                  <td className="py-2 pr-4">Até 2 horas</td>
                  <td className="py-2">Seg-Sex, 9h-18h BRT</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-2 pr-4">Email (geral)</td>
                  <td className="py-2 pr-4">Até 24 horas</td>
                  <td className="py-2">Dias úteis</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-2 pr-4">Email (segurança)</td>
                  <td className="py-2 pr-4">Até 48 horas</td>
                  <td className="py-2">Dias úteis</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-2 pr-4">GitHub Issues</td>
                  <td className="py-2 pr-4">Até 1 semana</td>
                  <td className="py-2">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>Parcerias e Imprensa</h2>
          <p>
            Para propostas de parceria, patrocínio ou consultas de imprensa,
            entre em contato pelo email{' '}
            <a
              href="mailto:parcerias@pixelfandom.com"
              className="text-primary hover:underline"
            >
              parcerias@pixelfandom.com
            </a>
            .
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
