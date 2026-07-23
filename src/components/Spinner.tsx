/**
 * Spinner reutilizável para estados de carregamento/recarregamento inline
 * (dentro de listas, cards, etc.) — diferente do overlay global de rota
 * em src/app/loading.tsx, que só cobre a navegação entre páginas.
 */
export default function Spinner({
  label,
  size = 22,
  className = "",
}: {
  label?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 py-8 ${className}`}>
      <span
        className="inline-block animate-spin rounded-full border-[3px] border-ink/10 border-t-red"
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
      {label && <span className="text-[13px] font-medium text-muted">{label}</span>}
    </div>
  );
}
