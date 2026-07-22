import { adminGetDashboardMetrics } from "@/app/actions/admin";

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

  return (
    <div>
      <h1 className="text-[22px] font-extrabold tracking-tight text-ink sm:text-[24px]">Dashboard</h1>
      <p className="mt-1 text-[14px] font-medium text-muted">Resultado do programa de pontos</p>

      {/* Dinheiro */}
      <SectionTitle>Faturamento &amp; custo</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi label="Faturamento gerado" value={brl(m.faturamento_total)} sub="notas aprovadas" accent="blue" />
        <Kpi label="Faturamento no mês" value={brl(m.faturamento_mes)} sub="mês atual" accent="blue" />
        <Kpi label="Ticket médio" value={brl(m.ticket_medio)} sub="por nota" accent="ink" />
        <Kpi
          label="Custo em descontos"
          value={brl(m.custo_descontos)}
          sub="resgates usados"
          accent="red"
        />
      </div>

      {/* Eficiência / passivo */}
      <SectionTitle>Eficiência do programa</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi
          label="Custo / faturamento"
          value={`${custoPct.toFixed(1)}%`}
          sub="quanto devolvi em desconto"
          accent="ink"
        />
        <Kpi
          label="Descontos a compensar"
          value={brl(m.custo_descontos_pendente)}
          sub="vouchers ativos"
          accent="amber"
        />
        <Kpi
          label="Pontos em circulação"
          value={num(m.pontos_em_circulacao)}
          sub="passivo a resgatar"
          accent="amber"
        />
        <Kpi
          label="Taxa de aprovação"
          value={`${taxaAprov.toFixed(0)}%`}
          sub="notas aprovadas"
          accent="blue"
        />
      </div>

      {/* Operação */}
      <SectionTitle>Operação</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi label="Clientes ativos" value={`${num(m.clientes_ativos)} / ${num(m.clientes_total)}`} sub="com nota / total" accent="ink" />
        <Kpi label="Notas hoje" value={num(m.notas_hoje)} accent="ink" />
        <Kpi label="Notas pendentes" value={num(m.notas_pendentes)} sub="aguardando" accent="amber" />
        <Kpi label="Resgates a usar" value={num(m.resgates_ativos)} sub="baixa no caixa" accent="red" />
      </div>

      {/* Gráfico */}
      <div className="glass mt-6 rounded-2xl p-4 shadow-soft sm:mt-8 sm:p-6">
        <h2 className="text-[15px] font-bold text-ink">Notas — últimos 7 dias</h2>
        <div className="mt-6 flex items-end gap-2 sm:gap-3" style={{ height: 160 }}>
          {m.notas_por_dia.map((d) => {
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 mt-6 text-[12px] font-bold uppercase tracking-wider text-muted first:mt-6">
      {children}
    </h2>
  );
}

function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: "blue" | "red" | "amber" | "ink";
}) {
  const bar = { blue: "bg-blue", red: "bg-red", amber: "bg-amber-500", ink: "bg-ink" }[accent];
  return (
    <div className="glass relative overflow-hidden rounded-2xl p-4 shadow-soft sm:p-5">
      <span className={`absolute inset-y-0 left-0 w-1 ${bar}`} />
      <div className="text-[11.5px] font-semibold text-muted">{label}</div>
      <div className="mt-1.5 text-[19px] font-extrabold leading-tight tracking-tight text-ink sm:text-[22px]">
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[10.5px] font-medium text-muted">{sub}</div>}
    </div>
  );
}
