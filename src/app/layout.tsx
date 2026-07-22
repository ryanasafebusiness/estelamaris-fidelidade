import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#E11D2E",
};

export const metadata: Metadata = {
  title: "Estelamaris — Programa de pontos",
  description: "Envie a nota, ganhe pontos, troque por desconto. Farmácia Estelamaris.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Estelamaris",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-dvh bg-surface text-ink transition-colors duration-300" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
