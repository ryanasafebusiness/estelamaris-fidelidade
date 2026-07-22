import { requireAuthAndProfile } from "@/app/actions/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireAuthAndProfile();
  return <>{children}</>;
}
