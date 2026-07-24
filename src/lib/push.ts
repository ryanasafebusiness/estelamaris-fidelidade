// Helpers pro fluxo de Web Push no client (registrar SW, assinar, salvar no banco).
import { createClient } from "@/lib/supabase/client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function pushSuportado() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

export async function ativarPush(userId: string): Promise<{ ok: boolean; error?: string }> {
  if (!pushSuportado()) return { ok: false, error: "Navegador sem suporte a notificações." };

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return { ok: false, error: "Chave VAPID não configurada." };

  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") return { ok: false, error: "Permissão negada." };

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  let sub = await registration.pushManager.getSubscription();
  if (!sub) {
    sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
  }

  const json = sub.toJSON();
  const supabase = createClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: json.endpoint!,
      p256dh: json.keys!.p256dh,
      auth_key: json.keys!.auth,
      user_agent: navigator.userAgent,
    },
    { onConflict: "user_id,endpoint" },
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function desativarPush(userId: string): Promise<{ ok: boolean; error?: string }> {
  if (!pushSuportado()) return { ok: true };

  const registration = await navigator.serviceWorker.getRegistration();
  const sub = await registration?.pushManager.getSubscription();
  if (!sub) return { ok: true };

  const endpoint = sub.endpoint;
  await sub.unsubscribe();

  const supabase = createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", endpoint);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
