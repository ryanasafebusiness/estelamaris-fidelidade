"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Camera, Close, Receipt } from "@/components/icons";

type Status = "idle" | "preview" | "uploading" | "processing" | "success" | "error";

export default function EnviarNotaPage() {
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<Status>("idle");
  const [fileToUpload, setFileToUpload] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pontos, setPontos] = useState<number>(0);
  const [receiptId, setReceiptId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpa URLs criadas
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Realtime subscription
  useEffect(() => {
    if (status !== "processing" || !receiptId) return;

    const channel = supabase
      .channel(`receipt-${receiptId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "receipts",
          filter: `id=eq.${receiptId}`,
        },
        (payload) => {
          const updated = payload.new;
          if (updated.status === "aprovada") {
            setPontos(updated.pontos_gerados || 0);
            setStatus("success");
          } else if (updated.status === "rejeitada") {
            setErrorMsg(updated.motivo_rejeicao || "Nota rejeitada. Tente novamente.");
            setStatus("error");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [status, receiptId, supabase]);

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 1600;
          let width = img.width;
          let height = img.height;

          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas não suportado"));
          
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Falha ao comprimir imagem"));
            },
            "image/jpeg",
            0.8
          );
        };
        img.onerror = () => reject(new Error("Falha ao carregar imagem"));
      };
      reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBlob = await compressImage(file);
      setFileToUpload(compressedBlob);
      
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(compressedBlob));
      
      setStatus("preview");
      setErrorMsg(null);
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao processar imagem.");
      setStatus("error");
    }
  };

  const handleUpload = async () => {
    if (!fileToUpload) return;
    setStatus("uploading");
    setErrorMsg(null);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("Usuário não autenticado");
      const userId = userData.user.id;

      const uuid = crypto.randomUUID();
      const storagePath = `${userId}/${uuid}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("notas")
        .upload(storagePath, fileToUpload, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) throw new Error("Falha ao enviar imagem");

      const { data: receiptData, error: dbError } = await supabase
        .from("receipts")
        .insert({
          user_id: userId,
          status: "pendente",
          storage_path: storagePath,
        })
        .select("id")
        .single();

      if (dbError) throw new Error("Falha ao registrar nota");

      setReceiptId(receiptData.id);
      setStatus("processing");
    } catch (err) {
      console.error(err);
      setErrorMsg((err as Error).message || "Ocorreu um erro no envio.");
      setStatus("error");
    }
  };

  const handleRetry = () => {
    setStatus("idle");
    setFileToUpload(null);
    setPreviewUrl(null);
    setErrorMsg(null);
    setReceiptId(null);
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col px-4 pb-4">
      {/* Header */}
      <header className="flex items-center justify-between pt-4 pb-2">
        <button
          onClick={() => router.back()}
          className="glass flex h-[38px] w-[38px] items-center justify-center rounded-full text-ink"
          aria-label="Voltar"
        >
          <Close />
        </button>
        <div className="text-[17px] font-extrabold tracking-tight">Enviar Nota</div>
        <div className="w-[38px]" /> {/* Spacer */}
      </header>

      {/* Main Content */}
      <section className="mt-4 flex flex-1 flex-col justify-center gap-6 text-center">
        {status === "idle" && (
          <div className="flex flex-col items-center gap-4">
            <div className="glass flex h-32 w-32 items-center justify-center rounded-3xl text-ink shadow-soft">
              <Camera width={48} height={48} />
            </div>
            <div>
              <h2 className="text-[20px] font-extrabold leading-tight">Fotografe sua nota</h2>
              <p className="mt-2 px-6 text-[14px] font-medium leading-relaxed text-muted">
                Capture o QR Code ou a nota inteira com clareza para ganhar pontos.
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 w-full max-w-[280px] rounded-2xl bg-gradient-to-b from-red to-red-deep py-4 text-[15px] font-extrabold tracking-wide text-white shadow-red transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Abrir Câmera
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {status === "preview" && previewUrl && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-full max-w-[280px] overflow-hidden rounded-3xl bg-ink/5 shadow-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Preview" className="h-[400px] w-full object-cover" />
            </div>
            <div className="flex w-full max-w-[280px] gap-3">
              <button
                onClick={handleRetry}
                className="glass flex-1 rounded-xl py-3.5 text-[14px] font-bold text-ink"
              >
                Retirar
              </button>
              <button
                onClick={handleUpload}
                className="flex-1 rounded-xl bg-ink py-3.5 text-[14px] font-bold text-white shadow-soft transition-transform hover:-translate-y-0.5"
              >
                Confirmar
              </button>
            </div>
          </div>
        )}

        {status === "uploading" && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-ink/20 border-t-ink"></div>
            <p className="text-[15px] font-bold text-muted">Enviando imagem...</p>
          </div>
        )}

        {status === "processing" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-blue/10 text-blue animate-pulse">
              <Receipt width={40} height={40} />
            </div>
            <h2 className="text-[20px] font-extrabold leading-tight">Analisando sua nota...</h2>
            <p className="text-[14px] font-medium text-muted px-4">
              A inteligência artificial está lendo os dados da compra. Pode levar alguns segundos.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10 text-green-600">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div>
              <h2 className="text-[24px] font-extrabold leading-tight text-green-600">Nota Aprovada!</h2>
              <p className="mt-1 text-[15px] font-medium text-muted">Você ganhou</p>
            </div>
            
            <AnimatedPoints target={pontos} />

            <Link
              href="/"
              className="mt-6 w-full max-w-[280px] rounded-2xl bg-ink py-4 text-[15px] font-extrabold tracking-wide text-white shadow-soft transition-transform hover:-translate-y-0.5"
            >
              Voltar ao Início
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red/10 text-red">
              <Close width={40} height={40} />
            </div>
            <h2 className="text-[20px] font-extrabold leading-tight text-red">Ops!</h2>
            <p className="text-[14px] font-medium text-muted">{errorMsg}</p>
            <button
              onClick={handleRetry}
              className="mt-4 w-full max-w-[280px] rounded-2xl bg-ink py-4 text-[15px] font-extrabold tracking-wide text-white shadow-soft"
            >
              Tentar outra foto
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

// Componente para animar a contagem de pontos
function AnimatedPoints({ target }: { target: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {

    const duration = 1500; // ms
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing out quint
      const easeOut = 1 - Math.pow(1 - progress, 5);
      
      setCount(Math.floor(easeOut * target));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [target]);

  return (
    <div className="text-[64px] font-extrabold leading-none tracking-tighter text-ink mt-2">
      +{count}
      <span className="ml-1.5 text-[20px] font-bold tracking-normal text-muted">pts</span>
    </div>
  );
}
