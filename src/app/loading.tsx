export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface/50 backdrop-blur-sm">
      <div className="relative flex h-16 w-16 items-center justify-center">
        {/* Anel de fundo */}
        <div className="absolute inset-0 rounded-full border-[3px] border-line opacity-30"></div>
        {/* Anel giratório */}
        <div className="absolute inset-0 rounded-full border-[3px] border-red border-t-transparent animate-spin"></div>
        {/* Logo pulsante no meio (opcional) */}
        <div className="h-6 w-6 animate-pulse rounded-full bg-red/10"></div>
      </div>
      <p className="mt-4 text-[12px] font-bold uppercase tracking-widest text-muted animate-pulse">
        Carregando
      </p>
    </div>
  );
}
