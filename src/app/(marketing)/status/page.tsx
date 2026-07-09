import Link from 'next/link';

const services = [
  {
    name: 'Website',
    status: 'operational' as const,
    uptime: '99.97%',
  },
  {
    name: 'API',
    status: 'operational' as const,
    uptime: '99.95%',
  },
  {
    name: 'Autenticação (Supabase)',
    status: 'operational' as const,
    uptime: '99.99%',
  },
  {
    name: 'Banco de Dados (Supabase)',
    status: 'operational' as const,
    uptime: '99.98%',
  },
  {
    name: 'Assistente IA',
    status: 'operational' as const,
    uptime: '99.90%',
  },
  {
    name: 'Discord Bot',
    status: 'operational' as const,
    uptime: '99.85%',
  },
  {
    name: 'Upload de Arquivos',
    status: 'operational' as const,
    uptime: '99.93%',
  },
];

const incidents = [
  {
    date: '10 de Junho, 2026',
    title: 'Latência elevada no banco de dados',
    status: 'resolved' as const,
    description:
      'Picos de latência entre 14h e 15h BRT devido a uma consulta não otimizada em uma wiki de grande porte. Corrigido com a adição de índices apropriados.',
  },
  {
    date: '28 de Maio, 2026',
    title: 'Indisponibilidade do Assistente IA',
    status: 'resolved' as const,
    description:
      'O provedor OpenRouter apresentou instabilidade entre 11h e 12h BRT, afetando o assistente IA de todas as wikis. O failover automático para Gemini foi ativado.',
  },
  {
    date: '15 de Maio, 2026',
    title: 'Manutenção programada da API',
    status: 'resolved' as const,
    description:
      'Atualização de versão da API entre 3h e 4h BRT. Durante este período, a API ficou indisponível por aproximadamente 12 minutos.',
  },
];

function StatusBadge({ status }: { status: 'operational' | 'degraded' | 'outage' | 'resolved' }) {
  const colors = {
    operational:
      'text-green-400 bg-green-500/10 border-green-500/30',
    degraded:
      'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    outage:
      'text-red-400 bg-red-500/10 border-red-500/30',
    resolved:
      'text-muted-foreground bg-white/[0.04] border-white/[0.08]',
  };

  const labels = {
    operational: 'Operacional',
    degraded: 'Degradado',
    outage: 'Indisponível',
    resolved: 'Resolvido',
  };

  return (
    <span
      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${colors[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export default function StatusPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.5)]" />
        <h1 className="text-3xl font-bold">Status</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        Todos os sistemas operacionais
      </p>

      <div className="space-y-3 mb-10">
        {services.map((service) => (
          <div
            key={service.name}
            className="flex items-center justify-between rounded-xl border border-border/30 bg-black/20 px-5 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.4)]" />
              <span className="text-sm font-medium">{service.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Uptime: {service.uptime}
              </span>
              <StatusBadge status={service.status} />
            </div>
          </div>
        ))}
      </div>

      {incidents.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">
            Incidentes nos Últimos 30 Dias
          </h2>
          <div className="space-y-4">
            {incidents.map((incident) => (
              <div
                key={incident.date}
                className="rounded-xl border border-border/30 bg-black/20 p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <time className="text-xs text-muted-foreground">
                    {incident.date}
                  </time>
                  <StatusBadge status={incident.status} />
                </div>
                <h3 className="text-base font-semibold mb-1">
                  {incident.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {incident.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10 rounded-xl border border-border/30 bg-black/20 p-5">
        <h2 className="text-base font-semibold mb-2">
          Histórico de Uptime
        </h2>
        <p className="text-sm text-muted-foreground">
          Este mês: <strong className="text-foreground">99.94%</strong> de
          uptime geral. Nosso objetivo é manter 99.9%+ de disponibilidade para
          todos os serviços. Acompanhe nosso status em tempo real no{' '}
          <Link
            href="https://discord.gg/pixelfandom"
            className="text-primary hover:underline"
          >
            Discord
          </Link>
          .
        </p>
      </section>

      <div className="mt-10 pt-6 border-t border-border/30">
        <Link href="/" className="text-primary hover:underline text-sm">
          ← Voltar ao hub
        </Link>
      </div>
    </div>
  );
}
