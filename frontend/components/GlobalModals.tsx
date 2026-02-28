'use client';

import React, { FormEvent, useState } from "react";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { MaskedInput, currencyToNumber } from "./ui/MaskedInput";
import { Button } from "./ui/Button";
import { useModal } from "./ModalContext";
import { appendItem } from "@/lib/storage";
import { criarOS } from "@/lib/automation";

type Cliente = {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
};

type Lead = {
  id: string;
  nome: string;
  origem?: string;
  telefone?: string;
};

const CLIENTES_KEY = "clientes";
const LEADS_KEY = "leads";

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function GlobalModals() {
  const { state, closeModal } = useModal();

  const [formState, setFormState] = useState<Record<string, string>>({});

  const resetAndClose = () => {
    setFormState({});
    closeModal();
  };

  const handleChange = (field: string, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitCliente = (e: FormEvent) => {
    e.preventDefault();
    const cliente: Cliente = {
      id: generateId("cli"),
      nome: formState.nome ?? "",
      email: formState.email,
      telefone: formState.telefone
    };
    appendItem<Cliente>(CLIENTES_KEY, cliente);
    resetAndClose();
  };

  const handleSubmitLead = (e: FormEvent) => {
    e.preventDefault();
    const lead: Lead = {
      id: generateId("lead"),
      nome: formState.nome ?? "",
      origem: formState.origem,
      telefone: formState.telefone
    };
    appendItem<Lead>(LEADS_KEY, lead);
    resetAndClose();
  };

  const handleSubmitOS = (e: FormEvent) => {
    e.preventDefault();
    const valor = currencyToNumber(formState.valor ?? "0") || 0;
    criarOS({
      cliente: formState.cliente ?? "",
      tipo: formState.tipo ?? "",
      valor
    });
    resetAndClose();
  };

  if (!state.type) return null;

  if (state.type === "quickCreateCliente") {
    return (
      <Modal
        open
        title="Novo Cliente Rápido"
        description="Cadastre rapidamente um cliente básico para usar nas OS e orçamentos."
        showFooter={false}
        onClose={resetAndClose}
      >
        <form
          className="space-y-3"
          onSubmit={handleSubmitCliente}
          noValidate={false}
        >
          <Input
            label="Nome do Cliente"
            placeholder="Ex: João da Silva"
            value={formState.nome ?? ""}
            onChange={(e) => handleChange("nome", e.target.value)}
            required
          />
          <Input
            label="E-mail"
            type="email"
            placeholder="cliente@empresa.com"
            value={formState.email ?? ""}
            onChange={(e) => handleChange("email", e.target.value)}
          />
          <Input
            label="Telefone"
            placeholder="(11) 99999-9999"
            value={formState.telefone ?? ""}
            onChange={(e) => handleChange("telefone", e.target.value)}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetAndClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
            >
              Salvar Cliente
            </Button>
          </div>
        </form>
      </Modal>
    );
  }

  if (state.type === "quickCreateLead") {
    return (
      <Modal
        open
        title="Novo Lead Rápido"
        description="Capture um lead rapidamente a partir de qualquer tela."
        showFooter={false}
        onClose={resetAndClose}
      >
        <form
          className="space-y-3"
          onSubmit={handleSubmitLead}
          noValidate={false}
        >
          <Input
            label="Nome do Lead"
            placeholder="Ex: Maria Souza"
            value={formState.nome ?? ""}
            onChange={(e) => handleChange("nome", e.target.value)}
            required
          />
          <Input
            label="Origem"
            placeholder="Ex: Indicação, Google, Instagram"
            value={formState.origem ?? ""}
            onChange={(e) => handleChange("origem", e.target.value)}
          />
          <Input
            label="Telefone"
            placeholder="(11) 99999-9999"
            value={formState.telefone ?? ""}
            onChange={(e) => handleChange("telefone", e.target.value)}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetAndClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
            >
              Salvar Lead
            </Button>
          </div>
        </form>
      </Modal>
    );
  }

  if (state.type === "quickCreateOS") {
    return (
      <Modal
        open
        title="Nova OS Rápida"
        description="Crie uma Ordem de Serviço rápida. A fatura será gerada automaticamente."
        showFooter={false}
        onClose={resetAndClose}
      >
        <form
          className="space-y-3"
          onSubmit={handleSubmitOS}
          noValidate={false}
        >
          <Input
            label="Cliente"
            placeholder="Nome do cliente"
            value={formState.cliente ?? ""}
            onChange={(e) => handleChange("cliente", e.target.value)}
            required
          />
          <Input
            label="Tipo de OS"
            placeholder="Instalação, Manutenção, etc."
            value={formState.tipo ?? ""}
            onChange={(e) => handleChange("tipo", e.target.value)}
            required
          />
          <MaskedInput
            label="Valor (R$)"
            mask="currency"
            placeholder="R$ 0,00"
            value={formState.valor ?? ""}
            onChange={(val) => handleChange("valor", val)}
            required
          />
          <p className="mt-1 text-xs text-slate-700 dark:text-slate-400">
            Ao salvar, uma fatura será criada automaticamente com base neste valor.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetAndClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
            >
              Salvar OS
            </Button>
          </div>
        </form>
      </Modal>
    );
  }

  return null;
}

