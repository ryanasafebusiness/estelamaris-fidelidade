import BottomNav from "@/components/BottomNav";

type Active = "home" | "recompensas" | "meus-resgates" | "historico";

export default function EmBreve({ titulo, current }: { titulo: string; current: Active }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col px-4 pb-2">
      <header className="flex items-center justify-center pt-4">
        <div className="flex items-center justify-center">
          <img src="/logo-pontos.png" alt="Estelamaris" className="h-8 w-auto object-contain" />
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <h1 className="text-[22px] font-extrabold tracking-tight">{titulo}</h1>
        <p className="text-[13px] font-semibold text-muted">Em breve nesta tela.</p>
      </div>

      <BottomNav current={current} />
    </main>
  );
}
