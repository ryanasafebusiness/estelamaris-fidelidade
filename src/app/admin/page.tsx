import { adminGetDashboardMetrics } from "@/app/actions/admin";
import { Receipt, User, History, ArrowUp } from "@/components/icons";

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function num(n: number) {
  return Math.round(n).toLocaleString("pt-BR");
}

export default async function AdminDashboardPage() {
  const m = await adminGetDashboardMetrics();
  const maxNotas = Math.max(...m.notas_por_dia.map((d) => d.count), 1);

  const taxaAprov =
    m.notas_aprovadas + m.notas_rejeitadas > 0
      ? (m.notas_aprovadas / (m.notas_aprovadas + m.notas_rejeitadas)) * 100
      : 0;
  const custoPct = m.faturamento_total > 0 ? (m.custo_descontos / m.faturamento_total) * 100 : 0;

  // Gerar path do gráfico simulado do Hero (baseado em notas)
  const chartPoints = m.notas_por_dia
    .map((d, i) => {
      const x = (i / Math.max(m.notas_por_dia.length - 1, 1)) * 100;
      const y = 100 - (d.count / maxNotas) * 100;
      return `${x},${y}`;
    })
    .join(" L ");
  const svgPath = `M 0,100 L 0,${100 - (m.notas_por_dia[0]?.count / maxNotas || 0) * 100} L ${chartPoints} L 100,100 Z`;
  const linePath = `M 0,${100 - (m.notas_por_dia[0]?.count / maxNotas || 0) * 100} L ${chartPoints}`;

  return (
    <div className="pb-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink sm:text-[24px]">Analysis</h1>
          <p className="mt-0.5 text-[13px] font-medium text-muted">Resultado do programa</p>
        </div>
      </header>

      {/* Hero Card - Faturamento */}
      <section className="relative mb-6 overflow-hidden rounded-[24px] bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white shadow-lg shadow-red/30">
        <div className="relative z-10">
          <div className="text-[13px] font-semibold text-white/80">Faturamento gerado</div>
          <div className="mt-1 text-[32px] font-extrabold tracking-tighter">{brl(m.faturamento_total)}</div>
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">
              +15%
            </span>
            <span className="text-[11px] font-medium text-white/70">comparado ao mês passado</span>
          </div>
        </div>
        
        {/* Gráfico decorativo de fundo no Hero Card */}
        <div className="absolute inset-x-0 bottom-0 h-[100px] opacity-40">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
            <defs>
              <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={svgPath} fill="url(#heroGrad)" />
            <path d={linePath} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Um ponto brilhante no último dia */}
            {m.notas_por_dia.length > 0 && (
              <circle
                cx="100"
                cy={100 - (m.notas_por_dia[m.notas_por_dia.length - 1].count / maxNotas) * 100}
                r="3"
                fill="white"
                className="drop-shadow-md"
              />
            )}
          </svg>
        </div>
      </section>

      {/* Grid de KPIs 2x2 */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4">
        <KpiCard
          title="Faturamento mês"
          value={brl(m.faturamento_mes)}
          icon={<Receipt width={18} height={18} />}
          color="blue"
          trend="+12%"
        />
        <KpiCard
          title="Clientes ativos"
          value={num(m.clientes_ativos)}
          icon={<User width={18} height={18} />}
          color="amber"
          trend="+5%"
        />
        <KpiCard
          title="Descontos (Custo)"
          value={brl(m.custo_descontos)}
          icon={<History width={18} height={18} />}
          color="red"
          trend={`${custoPct.toFixed(1)}%`}
        />
        <KpiCard
          title="Aprovação de notas"
          value={`${taxaAprov.toFixed(0)}%`}
          icon={<ArrowUp width={18} height={18} />}
          color="green"
          trend="Estável"
        />
      </div>

      {/* Gráfico de Barras - Notas por dia */}
      <section className="glass rounded-[24px] p-5 shadow-soft">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold text-ink">Notas por dia</h2>
          <span className="rounded-full bg-ink/5 px-3 py-1 text-[11px] font-bold text-muted">Últimos 7 dias</span>
        </div>
        
        <div className="flex items-end justify-between gap-2 px-1" style={{ height: 160 }}>
          {m.notas_por_dia.map((d) => {
            const pct = maxNotas > 0 ? (d.count / maxNotas) * 100 : 0;
            const dayLabel = new Date(d.dia + "T12:00:00").toLocaleDateString("pt-BR", {
              weekday: "short",
            }).substring(0, 3);
            return (
              <div key={d.dia} className="group flex flex-1 flex-col items-center gap-2">
                <span className="text-[11px] font-bold text-muted opacity-0 transition-opacity group-hover:opacity-100">
                  {d.count}
                </span>
                <div className="relative w-full max-w-[24px] flex-1">
                  <div
                    className="absolute bottom-0 w-full rounded-full bg-gradient-to-t from-orange-400 to-orange-300 transition-all duration-500 ease-out"
                    style={{ height: `${Math.max(pct, 6)}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold capitalize text-muted">{dayLabel}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
  color,
  trend,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "blue" | "red" | "amber" | "green";
  trend: string;
}) {
  const colorStyles = {
    blue: "bg-blue/10 text-blue",
    red: "bg-red/10 text-red",
    amber: "bg-amber-500/15 text-amber-600",
    green: "bg-emerald-500/15 text-emerald-600",
  }[color];

  return (
    <div className="glass flex flex-col justify-between rounded-[20px] p-4 shadow-soft">
      <div className="flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${colorStyles}`}>
          {icon}
        </div>
        <div className="text-[11.5px] font-bold text-muted leading-tight">{title}</div>
      </div>
      <div className="mt-3 text-[18px] font-extrabold tracking-tight text-ink sm:text-[22px]">
        {value}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="text-[10px] font-semibold text-muted">Update: Hoje</div>
        <div className={`text-[10px] font-extrabold ${trend.includes("+") ? "text-emerald-500" : "text-muted"}`}>
          {trend}
        </div>
      </div>
    </div>
  );
}
