import { adminGetDashboardMetrics } from "@/app/actions/admin";

export default async function AdminDashboardPage() {
  const m = await adminGetDashboardMetrics();
  const maxNotas = Math.max(...m.notasPorDia.map((d) => d.count), 1);

  return (
    <div>
      <h1 className="text-[22px] font-extrabold tracking-tight text-ink sm:text-[24px]">Dashboard</h1>
      <p className="mt-1 text-[14px] font-medium text-muted">Visão geral do programa de pontos</p>

      {/* Métricas */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard label="Clientes" value={fmt(m.totalClientes)} accent="blue" />
        <MetricCard label="Notas hoje" value={fmt(m.notasHoje)} accent="ink" />
        <MetricCard label="Notas pendentes" value={fmt(m.notasPendentes)} accent="amber" />
        <MetricCard
          label="Pontos cred. / resg."
          value={`${fmt(m.pontosCredTotal)} / ${fmt(m.pontosDebTotal)}`}
          accent="red"
        />
      </div>

      {/* Gráfico */}
      <div className="glass mt-6 rounded-2xl p-4 shadow-soft sm:mt-8 sm:p-6">
        <h2 className="text-[15px] font-bold text-ink">Notas — últimos 7 dias</h2>
        <div className="mt-6 flex items-end gap-2 sm:gap-3" style={{ height: 160 }}>
          {m.notasPorDia.map((d) => {
            const pct = maxNotas > 0 ? (d.count / maxNotas) * 100 : 0;
            const dayLabel = new Date(d.dia + "T12:00:00").toLocaleDateString("pt-BR", {
              weekday: "short",
            });
            return (
              <div key={d.dia} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[12px] font-bold text-muted">{d.count}</span>
                <div
                  className="w-full rounded-lg bg-gradient-to-t from-blue to-blue-bright transition-all"
                  style={{ height: `${Math.max(pct, 4)}%`, minHeight: 6 }}
                />
                <span className="text-[11px] font-semibold capitalize text-muted">{dayLabel}</span>
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
  accent,
}: {
  label: string;
  value: string;
  accent: "blue" | "red" | "amber" | "ink";
}) {
  const bar = {
    blue: "bg-blue",
    red: "bg-red",
    amber: "bg-amber-500",
    ink: "bg-ink",
  }[accent];

  return (
    <div className="glass relative overflow-hidden rounded-2xl p-4 shadow-soft sm:p-5">
      <span className={`absolute inset-y-0 left-0 w-1 ${bar}`} />
      <div className="text-[11.5px] font-semibold text-muted">{label}</div>
      <div className="mt-2 text-[20px] font-extrabold tracking-tight text-ink sm:text-[24px]">
        {value}
      </div>
    </div>
  );
}

function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}
