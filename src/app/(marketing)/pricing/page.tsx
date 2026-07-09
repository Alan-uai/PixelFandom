import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">Preços</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Planos simples e flexíveis para todos os tamanhos de comunidade
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="rounded-xl border border-border/40 bg-black/30 p-6 text-center">
          <h3 className="text-lg font-semibold mb-1">Grátis</h3>
          <p className="text-3xl font-bold text-gradient-cyan mb-4">R$ 0</p>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li>✓ 1 wiki</li>
            <li>✓ Até 50 artigos</li>
            <li>✓ Subdomínio Vercel</li>
            <li>✓ Assistente IA básico</li>
            <li>✓ Até 5 membros</li>
          </ul>
        </div>
        <div className="rounded-xl border border-primary/30 bg-black/40 p-6 text-center relative">
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-semibold bg-primary text-primary-foreground px-3 py-0.5 rounded-full">
            Popular
          </span>
          <h3 className="text-lg font-semibold mb-1">Pro</h3>
          <p className="text-3xl font-bold text-gradient-cyan mb-4">R$ 29</p>
          <p className="text-xs text-muted-foreground mb-4">/mês</p>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li>✓ 3 wikis</li>
            <li>✓ Artigos ilimitados</li>
            <li>✓ Domínio personalizado</li>
            <li>✓ Assistente IA avançado</li>
            <li>✓ Membros ilimitados</li>
            <li>✓ Dados customizados</li>
            <li>✓ Integração com Discord</li>
          </ul>
        </div>
        <div className="rounded-xl border border-border/40 bg-black/30 p-6 text-center">
          <h3 className="text-lg font-semibold mb-1">Enterprise</h3>
          <p className="text-3xl font-bold text-gradient-cyan mb-4">
            Sob demanda
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li>✓ Wikis ilimitadas</li>
            <li>✓ Suporte prioritário</li>
            <li>✓ SLA garantido</li>
            <li>✓ Modelo IA customizado</li>
            <li>✓ Onboarding dedicado</li>
            <li>✓ Contrato personalizado</li>
          </ul>
        </div>
      </div>

      <div className="prose prose-invert space-y-6">
        <section>
          <h2>Comparativo Completo</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 pr-4 font-semibold">Recurso</th>
                  <th className="text-left py-2 pr-4 font-semibold">Grátis</th>
                  <th className="text-left py-2 pr-4 font-semibold">Pro</th>
                  <th className="text-left py-2 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/20">
                  <td className="py-2 pr-4">Wikis</td>
                  <td className="py-2 pr-4">1</td>
                  <td className="py-2 pr-4">3</td>
                  <td className="py-2">Ilimitadas</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-2 pr-4">Artigos</td>
                  <td className="py-2 pr-4">50</td>
                  <td className="py-2 pr-4">Ilimitados</td>
                  <td className="py-2">Ilimitados</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-2 pr-4">Domínio personalizado</td>
                  <td className="py-2 pr-4">—</td>
                  <td className="py-2 pr-4">✓</td>
                  <td className="py-2">✓</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-2 pr-4">Membros</td>
                  <td className="py-2 pr-4">5</td>
                  <td className="py-2 pr-4">Ilimitados</td>
                  <td className="py-2">Ilimitados</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-2 pr-4">Assistente IA</td>
                  <td className="py-2 pr-4">Básico</td>
                  <td className="py-2 pr-4">Avançado</td>
                  <td className="py-2">Customizado</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-2 pr-4">Dados customizados</td>
                  <td className="py-2 pr-4">—</td>
                  <td className="py-2 pr-4">✓</td>
                  <td className="py-2">✓</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-2 pr-4">Discord</td>
                  <td className="py-2 pr-4">—</td>
                  <td className="py-2 pr-4">✓</td>
                  <td className="py-2">✓</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-2 pr-4">Suporte</td>
                  <td className="py-2 pr-4">Comunidade</td>
                  <td className="py-2 pr-4">Email</td>
                  <td className="py-2">Prioritário 24/7</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>Perguntas Frequentes</h2>
          <h3>Posso mudar de plano depois?</h3>
          <p>
            Sim! Você pode fazer upgrade ou downgrade a qualquer momento. O
            valor é ajustado proporcionalmente ao剩余 do ciclo de faturamento.
          </p>
          <h3>Precisa de cartão de crédito para começar?</h3>
          <p>
            Não. O plano Grátis não requer cartão de crédito. Você pode
            experimentar a plataforma sem compromisso.
          </p>
          <h3>Existe desconto para ONGs ou projetos educacionais?</h3>
          <p>
            Sim, oferecemos descontos especiais para organizações sem fins
            lucrativos, instituições educacionais e projetos de código aberto.
            Entre em contato para mais informações.
          </p>
          <h3>O que é &ldquo;Assistente IA Avançado&rdquo;?</h3>
          <p>
            O plano Avançado inclui acesso a modelos de IA mais potentes,
            contexto maior para respostas mais precisas, e a possibilidade de
            escolher entre múltiplos provedores (OpenRouter, Gemini).
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
