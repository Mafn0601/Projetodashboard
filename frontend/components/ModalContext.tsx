'use client';

import React, { createContext, useContext, useState, ReactNode } from "react";

export type ModalType =
  | "quickCreateCliente"
  | "quickCreateOS"
  | "quickCreateLead"
  | "quickCreateFatura";
  
// adiciona tipo para veiculo
export type ExtendedModalType = ModalType | "quickCreateVeiculo";

interface ModalState {
  type: ExtendedModalType | null;
  data?: unknown;
}

interface ModalContextValue {
  state: ModalState;
  openModal: (type: ModalType, data?: unknown) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModalState>({ type: null });

  const openModal = (type: ExtendedModalType, data?: unknown) => {
    setState({ type, data });
  };

  const closeModal = () => {
    setState({ type: null, data: undefined });
  };

  return (
    <ModalContext.Provider value={{ state, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error("useModal deve ser usado dentro de ModalProvider");
  }
  return ctx;
}

