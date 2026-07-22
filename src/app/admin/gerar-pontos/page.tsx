import VoucherGenerator from "@/components/admin/VoucherGenerator";

export default function GerarPontosPage() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-[22px] font-extrabold text-ink">Gerar Vouchers de Pontos</h1>
        <p className="mt-1 text-[13px] font-medium text-muted">
          Crie QR Codes dinâmicos para presentear clientes com pontos no balcão da farmácia.
        </p>
      </div>

      <VoucherGenerator />
    </div>
  );
}
