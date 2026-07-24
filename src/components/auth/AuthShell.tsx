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
      <div className="flex flex-col items-center pt-14">
        <Link href="/" className="relative flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-red/25 blur-2xl" aria-hidden="true" />
          <Image
            src="/logo-mark.png"
            alt="Estelamaris"
            width={80}
            height={80}
            priority
            className="relative rounded-full shadow-red"
          />
        </Link>
        <span className="mt-3 text-[15px] font-extrabold tracking-tight text-ink">
          Drogaria Estelamaris
        </span>
      </div>

      <div className="glass mt-7 rounded-[26px] border border-line/60 p-5 shadow-glass">
        <h1 className="text-[21px] font-extrabold tracking-tight text-ink">{titulo}</h1>
        <p className="mt-1 text-[13px] font-semibold text-muted">{subtitulo}</p>
        <div className="mt-5">{children}</div>
      </div>

      {rodape ? (
        <div className="mt-5 text-center text-[13px] font-semibold text-muted">{rodape}</div>
      ) : null}
    </main>
  );
}
