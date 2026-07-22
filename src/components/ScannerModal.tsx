"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { useRouter } from "next/navigation";

export default function ScannerModal({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);

  useEffect(() => {
    async function initScanner() {
      const hasCam = await QrScanner.hasCamera();
      if (!hasCam) {
        setHasCamera(false);
        setError("Nenhuma câmera encontrada no dispositivo.");
        return;
      }

      if (videoRef.current) {
        scannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            if (result.data) {
              const url = result.data;
              // Verifica se é a URL do nosso resgate
              if (url.includes("/resgatar/")) {
                scannerRef.current?.stop();
                // Extrai o caminho e navega (para aproveitar o Next.js router)
                const path = new URL(url).pathname;
                router.push(path);
              } else {
                setError("QR Code inválido. Leia o cupom de pontos da loja.");
              }
            }
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 5,
          }
        );

        scannerRef.current.start().catch((err) => {
          console.error(err);
          setError("Sem permissão para usar a câmera ou erro de conexão seguro (HTTPS).");
        });
      }
    }

    initScanner();

    return () => {
      scannerRef.current?.stop();
      scannerRef.current?.destroy();
    };
  }, [router]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4 pt-12 text-white">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-extrabold">Ler QR Code</h2>
          <p className="text-sm text-white/60">Aponte para o cupom de pontos</p>
        </div>
        <button 
          onClick={onClose}
          className="rounded-full bg-white/20 p-2 text-white transition hover:bg-white/30"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error ? (
        <div className="rounded-xl bg-red/20 border border-red/50 p-4 text-center text-sm font-semibold text-red-400">
          {error}
        </div>
      ) : (
        <div className="relative mx-auto w-full max-w-sm aspect-square overflow-hidden rounded-3xl border-2 border-white/20">
          <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" />
        </div>
      )}
      
      {!error && hasCamera && (
        <p className="mt-8 text-center text-xs font-semibold text-white/50 animate-pulse">
          Procurando QR Code...
        </p>
      )}
    </div>
  );
}
