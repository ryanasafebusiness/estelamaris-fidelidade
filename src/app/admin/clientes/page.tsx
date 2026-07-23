"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Comprovante, { type ComprovanteData } from "@/components/admin/Comprovante";
import Spinner from "@/components/Spinner";

type Cliente = {
  id: string;
  nome: string | null;
  cpf: string | null;
  telefone: string | null;
  nivel: string;
  pontos_saldo: number;
  pontos_acumulados: number;
};
type Ledger = {
  id: number;
  tipo: string;
  pontos: number;
  saldo_apos: number | null;
  descricao: string | null;
  created_at: string;
};
type Receipt = {
  id: string;
  status: string;
  valor: number | null;
  pontos_gerados: number;
  estabelecimento: string | null;
  created_at: string;
};
type Redemption = {
  id: string;
  codigo: string;
  custo_pontos: number;
  status: string;
  created_at: string;
  expires_at: string | null;
  used_at: string | null;
  rewards?: { titulo: string; valor_reais: number } | null;
};

function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}
function brl(n: number | null) {
  return (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function d(s: string) {
  return new Date(s).toLocaleDateString("pt-BR");
}

export default function AdminClientesPage() {
  const supabase = createClient();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Cliente | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("profiles")
      .select("id, nome, cpf, telefone, nivel, pontos_saldo, pontos_acumulados")
      .order("pontos_acumulados", { ascending: false })
      .limit(500)
      .then(({ data }) => {
        if (cancelled) return;
        setClientes((data ?? []) as Cliente[]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = search
    ? clientes.filter(
        (c) =>
          c.nome?.toLowerCase().includes(search.toLowerCase()) ||
          (c.cpf ?? "").includes(search),
      )
    : clientes;

  return (
    <div>
      <h1 className="text-[22px] font-extrabold tracking-tight text-ink sm:text-[24px]">Clientes</h1>
      <p className="mt-1 text-[14px] font-medium text-muted">Base de clientes e histórico</p>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nome ou CPF…"
        className="mt-5 w-full rounded-xl border border-line bg-white/50 dark:bg-transparent px-4 py-3 text-[13px] font-medium text-ink outline-none placeholder:text-muted focus:border-blue focus:ring-2 focus:ring-blue/20"
      />

      <div className="mt-4 space-y-2">
        {loading && <Spinner label="Carregando…" />}
        {!loading && filtered.length === 0 && (
          <div className="py-8 text-center text-[13px] text-muted">Nenhum cliente.</div>
        )}
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c)}
            className="glass flex w-full items-center gap-3 rounded-2xl p-3.5 text-left shadow-soft transition-colors hover:bg-white/50 dark:bg-transparent sm:p-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[14px] font-bold text-ink">{c.nome || "—"}</span>
                <NivelBadge nivel={c.nivel} />
              </div>
              <div className="mt-0.5 text-[11.5px] text-muted">{c.cpf || "sem CPF"}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[15px] font-extrabold text-ink">{fmt(c.pontos_saldo)}</div>
              <div className="text-[10.5px] font-medium text-muted">saldo</div>
            </div>
          </button>
        ))}
      </div>

      {selected && <ClienteDetalhe cliente={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function NivelBadge({ nivel }: { nivel: string }) {
  const styles: Record<string, string> = {
    bronze: "bg-amber-500/15 text-amber-600",
    prata: "bg-blue/10 text-blue",
    ouro: "bg-red/10 text-red",
  };
  return (
    <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold capitalize ${styles[nivel] || "bg-ink/5 text-muted"}`}>
      {nivel}
    </span>
  );
}

function ClienteDetalhe({ cliente, onClose }: { cliente: Cliente; onClose: () => void }) {
  const supabase = createClient();
  const [tab, setTab] = useState<"extrato" | "notas" | "resgates">("extrato");
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [comprovante, setComprovante] = useState<ComprovanteData | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabase
        .from("points_ledger")
        .select("id, tipo, pontos, saldo_apos, descricao, created_at")
        .eq("user_id", cliente.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("receipts")
        .select("id, status, valor, pontos_gerados, estabelecimento, created_at")
        .eq("user_id", cliente.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("redemptions")
        .select("id, codigo, custo_pontos, status, created_at, expires_at, used_at, rewards(titulo, valor_reais)")
        .eq("user_id", cliente.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]).then(([l, r, rd]) => {
      if (cancelled) return;
      setLedger((l.data ?? []) as Ledger[]);
      setReceipts((r.data ?? []) as Receipt[]);
      setRedemptions((rd.data ?? []) as unknown as Redemption[]);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente.id]);

  const tabs: { key: typeof tab; label: string }[] = [
    { key: "extrato", label: "Extrato" },
    { key: "notas", label: "Notas" },
    { key: "resgates", label: "Resgates" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92dvh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-3xl border border-line glass shadow-glass sm:rounded-3xl">
        {/* Header */}
        <div className="border-b border-line p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-[17px] font-extrabold text-ink">
                  {cliente.nome || "—"}
                </h3>
                <NivelBadge nivel={cliente.nivel} />
              </div>
              <div className="mt-0.5 text-[12px] text-muted">
                {cliente.cpf || "sem CPF"} · {cliente.telefone || "sem telefone"}
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-full bg-ink/5 px-3 py-1.5 text-[12px] font-bold text-muted"
            >
              Fechar
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-ink/[0.03] p-3">
              <div className="text-[11px] font-semibold text-muted">Saldo</div>
              <div className="text-[18px] font-extrabold text-ink">{fmt(cliente.pontos_saldo)}</div>
            </div>
            <div className="rounded-xl bg-ink/[0.03] p-3">
              <div className="text-[11px] font-semibold text-muted">Acumulado (vitalício)</div>
              <div className="text-[18px] font-extrabold text-ink">
                {fmt(cliente.pontos_acumulados)}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-line px-3 py-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-lg px-3 py-2 text-[13px] font-bold transition-colors ${
                tab === t.key ? "bg-ink text-white" : "text-muted hover:bg-ink/5"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loading && <Spinner label="Carregando…" />}

          {!loading && tab === "extrato" && (
            <div className="space-y-2">
              {ledger.length === 0 && <Empty>Sem movimentações.</Empty>}
              {ledger.map((l) => {
                const pos = l.pontos >= 0;
                return (
                  <div key={l.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-bold text-ink">
                        {l.descricao || (pos ? "Crédito" : "Débito")}
                      </div>
                      <div className="text-[11px] text-muted">{d(l.created_at)}</div>
                    </div>
                    <div className={`text-[14px] font-extrabold ${pos ? "text-blue" : "text-red"}`}>
                      {pos ? "+" : "−"}
                      {fmt(Math.abs(l.pontos))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && tab === "notas" && (
            <div className="space-y-2">
              {receipts.length === 0 && <Empty>Sem notas.</Empty>}
              {receipts.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-ink">
                      {r.estabelecimento || "Nota"} · {r.valor ? brl(r.valor) : "—"}
                    </div>
                    <div className="text-[11px] text-muted">
                      {d(r.created_at)} · {r.status}
                    </div>
                  </div>
                  {r.pontos_gerados > 0 && (
                    <div className="text-[14px] font-extrabold text-blue">+{fmt(r.pontos_gerados)}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && tab === "resgates" && (
            <div className="space-y-2">
              {redemptions.length === 0 && <Empty>Sem resgates.</Empty>}
              {redemptions.map((r) => (
                <button
                  key={r.id}
                  onClick={() =>
                    setComprovante({
                      codigo: r.codigo,
                      reward: r.rewards?.titulo || "Recompensa",
                      valor_reais: r.rewards?.valor_reais ?? 0,
                      custo_pontos: r.custo_pontos,
                      cliente: cliente.nome || "—",
                      status: r.status,
                      created_at: r.created_at,
                      expires_at: r.expires_at,
                      used_at: r.used_at,
                    })
                  }
                  className="flex w-full items-center gap-3 rounded-xl border border-line p-3 text-left transition-colors hover:bg-ink/[0.02]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-ink">
                      {r.rewards?.titulo || "Recompensa"}
                    </div>
                    <div className="text-[11px] text-muted">
                      <span className="font-mono font-bold">{r.codigo}</span> · {d(r.created_at)} ·{" "}
                      {r.status}
                    </div>
                  </div>
                  <div className="text-[13px] font-extrabold text-red">−{fmt(r.custo_pontos)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {comprovante && <Comprovante data={comprovante} onClose={() => setComprovante(null)} />}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-8 text-center text-[13px] text-muted">{children}</div>;
}
