'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MaskedInput } from '@/components/ui/MaskedInput';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { CreateLeadPayload, LeadStatus } from '@/services/leadServiceAPI';

interface LeadCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateLeadPayload) => Promise<void>;
  isSubmitting: boolean;
}

const statusOptions: Array<{ value: LeadStatus; label: string }> = [
  { value: 'NOVO', label: 'Novo' },
  { value: 'CONTATO_REALIZADO', label: 'Contato Realizado' },
  { value: 'QUALIFICADO', label: 'Qualificado' },
  { value: 'CONVERTIDO', label: 'Convertido' },
  { value: 'PERDIDO', label: 'Perdido' },
];

const initialState: CreateLeadPayload = {
  nome: '',
  telefone: '',
  email: '',
  empresa: '',
  cargo: '',
  origem: '',
  status: 'NOVO',
  score: 65,
  observacoes: '',
};

export function LeadCreateModal({ open, onClose, onSubmit, isSubmitting }: LeadCreateModalProps) {
  const [form, setForm] = useState<CreateLeadPayload>(initialState);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initialState);
      setSubmitError(null);
    }
  }, [open]);

  const updateField = <K extends keyof CreateLeadPayload>(field: K, value: CreateLeadPayload[K]) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!form.email?.trim()) {
      setSubmitError('Email e obrigatorio para criar um lead.');
      return;
    }

    try {
      await onSubmit({
        ...form,
        email: form.email.trim(),
        empresa: form.empresa || undefined,
        cargo: form.cargo || undefined,
        origem: form.origem || undefined,
        observacoes: form.observacoes || undefined,
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Erro ao criar lead.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      showFooter={false}
      title="Adicionar Novo Lead"
      description="Capture um lead completo com dados comerciais e estágio inicial do funil."
      className="max-w-3xl"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Nome"
            value={form.nome ?? ''}
            onChange={(event) => updateField('nome', event.target.value)}
            placeholder="Ex: Mariana Alves"
            required
          />
          <MaskedInput
            label="Telefone"
            mask="phone"
            value={form.telefone ?? ''}
            onChange={(value) => updateField('telefone', value)}
            placeholder="(11) 99999-9999"
            required
          />
          <Input
            label="Empresa"
            value={form.empresa ?? ''}
            onChange={(event) => updateField('empresa', event.target.value)}
            placeholder="Ex: Atlas Mobility"
          />
          <Input
            label="Cargo"
            value={form.cargo ?? ''}
            onChange={(event) => updateField('cargo', event.target.value)}
            placeholder="Ex: Head de Operações"
          />
          <Input
            label="Email"
            type="email"
            value={form.email ?? ''}
            onChange={(event) => updateField('email', event.target.value)}
            placeholder="lead@empresa.com"
            required
          />
          <Input
            label="Origem"
            value={form.origem ?? ''}
            onChange={(event) => updateField('origem', event.target.value)}
            placeholder="Indicação, Site, WhatsApp"
          />
          <Select
            label="Estágio Inicial"
            options={statusOptions}
            value={form.status}
            onChange={(value) => updateField('status', value as LeadStatus)}
            placeholder="Selecione o estágio"
          />
          <Input
            label="Lead Score"
            type="number"
            min={0}
            max={100}
            value={String(form.score ?? 65)}
            onChange={(event) => updateField('score', Number(event.target.value || 0))}
            placeholder="0 a 100"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Observações</label>
          <textarea
            value={form.observacoes ?? ''}
            onChange={(event) => updateField('observacoes', event.target.value)}
            placeholder="Contexto, dor, próximo passo ou anotações do contato."
            className="min-h-28 w-full rounded-2xl border-2 border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {submitError && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            {submitError}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Criar Lead'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}