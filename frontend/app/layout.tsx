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
              (function() {
                try {
                  const theme = localStorage.getItem('theme-preference');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const isDark = theme === 'dark' || (!theme && prefersDark);
                  
                  const html = document.documentElement;
                  if (isDark) {
                    html.classList.add('dark');
                    html.style.colorScheme = 'dark';
                  } else {
                    html.classList.remove('dark');
                    html.style.colorScheme = 'light';
                  }
                } catch (e) {
                  console.error('Theme initialization error:', e);
                }
              })();
            `,
          }}
          suppressHydrationWarning
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

