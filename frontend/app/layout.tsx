import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AppLayout } from "@/components/AppLayout";
import { GlobalModals } from "@/components/GlobalModals";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard de Gestão de OS",
  description: "Sistema de gestão de Ordens de Serviço, Vendas e Inteligência Comercial."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme-preference');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased"
        )}
      >
        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
          <GlobalModals />
        </Providers>
      </body>
    </html>
  );
}

