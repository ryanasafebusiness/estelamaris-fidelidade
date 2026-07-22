import { adminGetDashboardMetrics } from "@/app/actions/admin";

export default async function AdminDashboardPage() {
  const m = await adminGetDashboardMetrics();
  const maxNotas = Math.max(...m.notasPorDia.map((d) => d.count), 1);

  return (
    <div className="animate-page-in">
      <h1 className="text-[24px] font-extrabold tracking-tight text-white">
        Dashboard
      </h1>
      <p className="mt-1 text-[14px] font-medium text-white/40">
        Visão geral do programa de pontos
      </p>

      {/* Metric cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Clientes ativos" value={fmt(m.totalClientes)} color="blue" />
        <MetricCard label="Notas hoje" value={fmt(m.notasHoje)} color="emerald" />
        <MetricCard label="Notas pendentes" value={fmt(m.notasPendentes)} color="amber" />
        <MetricCard
          label="Pontos cred. / resg."
          value={`${fmt(m.pontosCredTotal)} / ${fmt(m.pontosDebTotal)}`}
          color="purple"
        />
      </div>

      {/* Chart: notas por dia */}
      <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.03] p-6">
        <h2 className="text-[15px] font-bold text-white/70">Notas — últimos 7 dias</h2>
        <div className="mt-6 flex items-end gap-3" style={{ height: 160 }}>
          {m.notasPorDia.map((d) => {
            const pct = maxNotas > 0 ? (d.count / maxNotas) * 100 : 0;
            const dayLabel = new Date(d.dia + "T12:00:00").toLocaleDateString("pt-BR", {
              weekday: "short",
            });
            return (
              <div key={d.dia} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[12px] font-bold text-white/50">{d.count}</span>
                <div
                  className="w-full rounded-lg bg-gradient-to-t from-blue-500/80 to-blue-400/60 transition-all"
                  style={{ height: `${Math.max(pct, 4)}%`, minHeight: 6 }}
                />
                <span className="text-[11px] font-semibold text-white/30 capitalize">
                  {dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "blue" | "emerald" | "amber" | "purple";
}) {
  const colors = {
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/20",
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
    amber: "from-amber-500/20 to-amber-600/5 border-amber-500/20",
    purple: "from-purple-500/20 to-purple-600/5 border-purple-500/20",
  };

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-5 ${colors[color]}`}
    >
      <div className="text-[12px] font-semibold text-white/40">{label}</div>
      <div className="mt-2 text-[24px] font-extrabold tracking-tight text-white">
        {value}
      </div>
    </div>
  );
}

function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}
