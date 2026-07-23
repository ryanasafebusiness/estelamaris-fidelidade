import Link from "next/link";
import Image from "next/image";


/** Moldura das telas de auth: marca no topo + cartão glass central. */
export default function AuthShell({
  titulo,
  subtitulo,
  children,
  rodape,
}: {
  titulo: string;
  subtitulo: string;
  children: React.ReactNode;
  rodape?: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col px-5 pb-8">
      <div className="flex flex-col items-center pt-12">
        <Link href="/" className="text-[20px] font-extrabold tracking-tight text-ink">
          Drogaria Estelamaris
        </Link>
      </div>

      <div className="glass mt-8 rounded-[26px] p-5 shadow-glass">
        <h1 className="text-[20px] font-extrabold tracking-tight">{titulo}</h1>
        <p className="mt-1 text-[13px] font-semibold text-muted">{subtitulo}</p>
        <div className="mt-5">{children}</div>
      </div>

      {rodape ? (
        <div className="mt-5 text-center text-[13px] font-semibold text-muted">{rodape}</div>
      ) : null}
    </main>
  );
}
