'use client';

import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { ModalProvider } from "./ModalContext";
import { AuthProvider } from "./AuthContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      storageKey="theme-preference"
      themes={['light', 'dark']}
      forcedTheme={undefined}
    >
      <AuthProvider>
        <ModalProvider>{children}</ModalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

