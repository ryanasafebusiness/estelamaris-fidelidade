/**
 * Envia notificações push (Web Push) pra um usuário. Chamada só pelo n8n
 * (workflow "Notificações Push"), autenticada por um segredo compartilhado
 * — não é pra ser chamada pelo client.
 *
 * Corpo esperado: { user_id, title, body, url?, tag? }
 */
import "server-only";
import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

function vapidConfigurado() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  );
}

export async function POST(request: Request) {
  const segredo = request.headers.get("x-push-secret");
  if (!process.env.PUSH_SEND_SECRET || segredo !== process.env.PUSH_SEND_SECRET) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (!vapidConfigurado()) {
    return NextResponse.json({ error: "VAPID não configurado no servidor." }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const userId = body?.user_id as string | undefined;
  const title = body?.title as string | undefined;
  const msg = body?.body as string | undefined;
  const url = (body?.url as string | undefined) ?? "/";
  const tag = body?.tag as string | undefined;

  if (!userId || !title || !msg) {
    return NextResponse.json({ error: "Informe user_id, title e body." }, { status: 400 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  const admin = createAdminClient();
  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth_key")
    .eq("user_id", userId)
    .eq("ativo", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, deactivated: 0, motivo: "sem inscrições ativas" });
  }

  const payload = JSON.stringify({ title, body: msg, url, tag });

  let sent = 0;
  let failed = 0;
  let deactivated = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth_key },
          },
          payload,
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        const statusCode = (err as { statusCode?: number })?.statusCode;
        // 404/410 = inscrição não existe mais (usuário desativou/desinstalou) — desativa.
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").update({ ativo: false }).eq("id", s.id);
          deactivated++;
        }
      }
    }),
  );

  return NextResponse.json({ sent, failed, deactivated });
}
