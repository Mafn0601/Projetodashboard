'use client';
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Cliente, save, update } from '@/services/clienteService';
import { readArray } from '@/lib/storage';

type Parceiro = {
  id: string;
  nome: string;
  [key: string]: unknown;
};

type Equipe = {
  id: string;
  nome: string;
  login: string;
  parceiro: string;
  [key: string]: unknown;
};

type Props = {
  onSaved: () => void;
  initial?: Cliente;
};

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export default function ClienteForm({ onSaved, initial }: Props) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [parceiro, setParceiro] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [parceiroOptions, setParceiroOptions] = useState<SelectOption[]>([]);
  const [responsavelOptions, setResponsavelOptions] = useState<SelectOption[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Carregar parceiros e equipes do localStorage
  useEffect(() => {
    const parceiros = readArray<Parceiro>('parceiros');
    const options: SelectOption[] = parceiros.map((p) => ({
      value: p.id,
      label: p.nome
    }));
    setParceiroOptions(options);

    const equipesData = readArray<Equipe>('equipes');
    setEquipes(equipesData);
    atualizarResponsaveis(parceiro, equipesData);
  }, []);

  // Quando parceiro mudar, atualizar responsaveis
  useEffect(() => {
    atualizarResponsaveis(parceiro, equipes);
  }, [parceiro, equipes]);

  const atualizarResponsaveis = (parceiroId: string, equipesData: Equipe[]) => {
    const equipasFiltradas = equipesData.filter(e => e.parceiro === parceiroId);
    const options: SelectOption[] = equipasFiltradas.map((e) => ({
      value: e.id,
      label: e.login
    }));
    setResponsavelOptions(options);
    if (parceiroId && !equipasFiltradas.find(e => e.id === responsavel)) {
      setResponsavel('');
    }
  };

  // Sincronizar com dados de edição
  useEffect(() => {
    if (initial) {
      setNome(initial.nome ?? '');
      setEmail(initial.email ?? '');
      setTelefone(initial.telefone ?? '');
      setParceiro(initial.parceiro ?? '');
      setResponsavel(initial.responsavel ?? '');
    } else {
      setNome('');
      setEmail('');
      setTelefone('');
      setParceiro('');
      setResponsavel('');
    }
  }, [initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!nome.trim()) {
      nextErrors.nome = 'Campo obrigatorio';
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const cliente: Cliente = {
      id: initial?.id ?? generateId('cli'),
      nome,
      email,
      telefone,
      parceiro,
      responsavel
    };

    if (initial?.id) {
      update(initial.id, cliente);
    } else {
      save(cliente);
      setNome('');
      setEmail('');
      setTelefone('');
      setParceiro('');
      setResponsavel('');
    }

    onSaved();
  };

  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
      <Input
        label="Nome do Cliente"
        placeholder="Ex: João da Silva"
        value={nome}
        onChange={(e) => {
          setNome(e.target.value);
          if (errors.nome) {
            setErrors((prev) => {
              const next = { ...prev };
              delete next.nome;
              return next;
            });
          }
        }}
        error={errors.nome}
        required
      />
      <Select
        label="Parceiro"
        options={parceiroOptions}
        value={parceiro}
        onChange={(value) => setParceiro(value)}
        placeholder="Selecione um parceiro"
      />
      <Select
        label="Responsável (Equipe)"
        options={responsavelOptions}
        value={responsavel}
        onChange={(value) => setResponsavel(value)}
        placeholder="Selecione um responsável"
        disabled={!parceiro}
      />
      <Input
        label="E-mail"
        type="email"
        placeholder="cliente@empresa.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        label="Telefone"
        placeholder="(11) 99999-9999"
        value={telefone}
        onChange={(e) => setTelefone(e.target.value)}
      />
      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" size="sm">
          {initial?.id ? 'Atualizar' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}
