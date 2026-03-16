'use client';

import React, { useState, useEffect } from 'react';
import { ClienteCompleto } from '@/services/clienteService';
import { Button } from '@/components/ui/Button';
import { readArray } from '@/lib/storage';
import AgendaQuickModal from '@/components/agenda/AgendaQuickModal';
import { agendamentoServiceAPI } from '@/services/agendamentoServiceAPI';
import { parceiroServiceAPI, ParceiroAPI } from '@/services/parceiroServiceAPI';
import { equipeServiceAPI, EquipeAPI } from '@/services/equipeServiceAPI';
import { formatDateInBrasilia } from '@/lib/dateUtils';
import {
  mockFabricantes,
  mockModelos,
} from '@/lib/mockFormData';

type TipoOSItem = {
  id: string;
  nome: string;
  preco: number;
  desconto: number;
  tipo: 'servico' | 'produto';
  duracao: number;
};

type TipoOS = {
  id: string;
  nome: string;
  descricao?: string;
  itens: TipoOSItem[];
  [key: string]: unknown;
};



type Props = {
  isOpen: boolean;
  cliente: ClienteCompleto | null;
  onClose: () => void;
};

function formatarHorario(horario: string | undefined): string {
  if (!horario) return '-';
  
  // Se contém "hora_", extrai o número e formata
  const match = horario.match(/hora_(\d+)/);
  if (match && match[1]) {
    const hora = parseInt(match[1], 10);
    return `${String(hora).padStart(2, '0')}:00`;
  }
  
  // Se já está em formato HH:mm
  const timeMatch = horario.match(/\d{2}:\d{2}/);
  if (timeMatch) return timeMatch[0];
  
  return horario;
}

function obterLabel(id: string | undefined, array: Array<{ value: string; label: string }>): string {
  if (!id) return '-';
  const item = array.find(a => a.value === id);
  return item ? item.label : id;
}

function obterLabelFabricante(fabricanteId: string | undefined): string {
  return obterLabel(fabricanteId, mockFabricantes);
}

function obterLabelModelo(fabricanteId: string | undefined, modeloId: string | undefined): string {
  if (!fabricanteId || !modeloId) return '-';
  const modelos = mockModelos[fabricanteId];
  if (!modelos) return modeloId;
  return obterLabel(modeloId, modelos);
}

function formatarDataAgendamento(data: string | undefined): string {
  if (!data) return '-';
  const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(data);
  if (dateOnlyMatch) {
    const [year, month, day] = data.split('-');
    return `${day}/${month}/${year}`;
  }
  const parsed = new Date(data);
  if (isNaN(parsed.getTime())) return data;
  return formatDateInBrasilia(parsed);
}

export default function ClienteDetailsModal({ isOpen, cliente, onClose }: Props) {
  const [parceiros, setParceiros] = useState<ParceiroAPI[]>([]);
  const [equipes, setEquipes] = useState<EquipeAPI[]>([]);
  const [tiposOs, setTiposOs] = useState<TipoOS[]>([]);
  const [isAgendaQuickOpen, setIsAgendaQuickOpen] = useState(false);
  const [ultimoAgendamento, setUltimoAgendamento] = useState<any | null>(null);
  const [isLoadingAgendamento, setIsLoadingAgendamento] = useState(false);

  const carregarUltimoAgendamento = async (clienteId?: string) => {
    if (!clienteId) {
      setUltimoAgendamento(null);
      return;
    }

    setIsLoadingAgendamento(true);
    try {
      const agendamentos = await agendamentoServiceAPI.findAll({ clienteId, take: 30 });
      const ordenados = [...(agendamentos || [])].sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.createdAt || a.dataAgendamento || 0).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt || b.dataAgendamento || 0).getTime();
        return bTime - aTime;
      });
      setUltimoAgendamento(ordenados[0] || null);
    } catch (agendamentoError) {
      console.error('❌ Erro ao carregar agendamento:', agendamentoError);
      setUltimoAgendamento(null);
    } finally {
      setIsLoadingAgendamento(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const carregarDados = async () => {
        try {
          const [parceirosApi, equipesApi] = await Promise.all([
            parceiroServiceAPI.findAll({ preferCache: true }),
            equipeServiceAPI.findAll(undefined, undefined, { preferCache: true }),
          ]);

          setParceiros(parceirosApi || []);
          setEquipes(equipesApi || []);

          const tiposOsCadastrados = readArray<TipoOS>('tiposOs');
          setTiposOs(tiposOsCadastrados);

          await carregarUltimoAgendamento(cliente?.id);
        } catch (e) {
          console.error('❌ Erro ao carregar dados do cliente:', e);
          setUltimoAgendamento(null);
          setIsLoadingAgendamento(false);
        }
      };

      carregarDados();
    }
  }, [isOpen, cliente?.id]);

  // Debug: monitorar quando ultimoAgendamento muda
  useEffect(() => {
    if (ultimoAgendamento) {
      console.log('📍 ultimoAgendamento atualizado:', {
        id: ultimoAgendamento.id,
        responsavel: ultimoAgendamento.responsavel,
        parceiro: ultimoAgendamento.parceiro,
      });
    }
  }, [ultimoAgendamento]);

  const extrairIdOuNome = (valor: unknown): { id?: string; nome?: string } => {
    if (!valor) return {};
    if (typeof valor === 'string') return { id: valor };
    if (typeof valor === 'object') {
      const obj = valor as { id?: unknown; nome?: unknown };
      return {
        id: typeof obj.id === 'string' ? obj.id : undefined,
        nome: typeof obj.nome === 'string' ? obj.nome : undefined,
      };
    }
    return {};
  };

  const obterLabelParceiro = (parceiroValor: unknown): string => {
    // Prioridade 1: Se tem ultimoAgendamento com parceiro, usa esse
    if (ultimoAgendamento?.parceiro?.nome) {
      return ultimoAgendamento.parceiro.nome;
    }

    // Prioridade 2: Se tem um valor direto no cliente
    const { id, nome } = extrairIdOuNome(parceiroValor);
    if (nome) return nome;
    if (id) {
      const parceiro = parceiros.find(p => p.id === id);
      if (parceiro) return parceiro.nome || parceiro.id;
    }
    // Se for uma string simples (pode ser o nome do parceiro)
    if (typeof parceiroValor === 'string' && parceiroValor !== '-') {
      return parceiroValor;
    }

    return '-';
  };

  const obterLabelResponsavel = (responsavelValor: unknown): string => {
    if (ultimoAgendamento?.responsavel?.nome) {
      return ultimoAgendamento.responsavel.nome;
    }
    if (ultimoAgendamento?.responsavel?.login) {
      return ultimoAgendamento.responsavel.login;
    }

    const { id, nome } = extrairIdOuNome(responsavelValor);
    if (nome) return nome;
    if (id) {
      const equipe = equipes.find(e => e.id === id);
      if (equipe) {
        return equipe.nome || equipe.login || id;
      }
    }

    if (typeof responsavelValor === 'string' && responsavelValor !== '-') {
      return responsavelValor;
    }

    return '-';
  };

  const obterLabelTipoAgendamento = (tipoId: string | undefined): string => {
    if (!tipoId) return '-';
    const tipo = tiposOs.find(t => t.id === tipoId);
    return tipo ? tipo.nome : tipoId;
  };

  const obterLabelTipo = (tipoAgendamentoId: string | undefined, itemId: string | undefined): string => {
    if (!tipoAgendamentoId || !itemId) return '-';
    const tipoOs = tiposOs.find(t => t.id === tipoAgendamentoId);
    if (!tipoOs || !tipoOs.itens) return itemId;
    const item = tipoOs.itens.find(i => i.id === itemId);
    return item ? `${item.nome} (${item.tipo === 'servico' ? 'Serviço' : 'Produto'})` : itemId;
  };

  if (!isOpen || !cliente) return null;

  const veiculoPrincipal = cliente.veiculos?.[0];

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={(e) => e.target === e.currentTarget && !isAgendaQuickOpen && onClose()}
      >
      <div className="bg-white dark:bg-slate-950 rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Detalhes do Cliente: {cliente.nome || cliente.nomeCliente || 'Sem nome'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-700 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-modal pr-2">
          {/* Body */}
          <div className="p-6 space-y-6">
          {/* Seção: Informações do Cliente */}
           <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Informações do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
               <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">Nome</p>
               <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">{cliente.nome || cliente.nomeCliente || '-'}</p>
              </div>
              <div>
               <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">Email</p>
               <p className="text-sm text-slate-900 dark:text-slate-100">{cliente.email || cliente.emailCliente || '-'}</p>
              </div>
              <div>
               <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">Telefone</p>
               <p className="text-sm text-slate-900 dark:text-slate-100">{cliente.telefone || '-'}</p>
              </div>
              <div>
               <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">CPF/CNPJ</p>
               <p className="text-sm text-slate-900 dark:text-slate-100 font-mono">{cliente.cpfCnpj || '-'}</p>
              </div>
              <div>
               <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">Responsável</p>
               <p className="text-sm text-slate-900 dark:text-slate-100">
                 {isLoadingAgendamento ? '⏳ Carregando...' : obterLabelResponsavel(cliente.responsavel)}
               </p>
              </div>
              <div>
               <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">Parceiro</p>
               <p className="text-sm text-slate-900 dark:text-slate-100">
                 {isLoadingAgendamento ? '⏳ Carregando...' : obterLabelParceiro(cliente.parceiro)}
               </p>
              </div>
            </div>
          </div>

          {/* Seção: Informações do Veículo */}
           <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Informações do Veículo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
               <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">Fabricante</p>
               <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">{obterLabelFabricante(cliente.fabricante || veiculoPrincipal?.fabricante || veiculoPrincipal?.marca)}</p>
              </div>
              <div>
               <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">Modelo</p>
               <p className="text-sm text-slate-900 dark:text-slate-100">{obterLabelModelo(cliente.fabricante || veiculoPrincipal?.fabricante || veiculoPrincipal?.marca, cliente.modelo || veiculoPrincipal?.modelo)}</p>
              </div>
              <div>
               <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">Placa/Chassi</p>
               <p className="text-sm text-slate-900 dark:text-slate-100 font-mono">{cliente.placaChassi || cliente.placa || veiculoPrincipal?.placa || cliente.chassi || veiculoPrincipal?.chassi || '-'}</p>
              </div>
              <div>
               <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">Cor</p>
               <p className="text-sm text-slate-900 dark:text-slate-100">{cliente.cor || veiculoPrincipal?.cor || '-'}</p>
              </div>
            </div>
          </div>

          {/* Seção: Metadados */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-700 dark:text-slate-400 mb-1">Criado em</p>
                <p className="text-slate-600 dark:text-slate-300">
                  {cliente.createdAt || cliente.dataCriacao 
                    ? formatDateInBrasilia(cliente.createdAt || cliente.dataCriacao!)
                    : '-'
                  }
                </p>
              </div>
              <div>
                 <p className="text-slate-700 dark:text-slate-400 mb-1">Atualizado em</p>
                <p className="text-slate-600 dark:text-slate-300">
                  {cliente.updatedAt || cliente.dataAtualizacao 
                    ? formatDateInBrasilia(cliente.updatedAt || cliente.dataAtualizacao!)
                    : '-'
                  }
                </p>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-end gap-3">
          <Button
            variant="primary"
            onClick={() => {
              try {
                localStorage.setItem(
                  'debug:agendar:last',
                  JSON.stringify({
                    t: Date.now(),
                    step: 'cliente-details:click-agendar',
                    details: { clienteId: cliente.id },
                  })
                );
              } catch {
                // noop
              }
              setIsAgendaQuickOpen(true);
            }}
          >
            Agendar
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>

      </div>
      </div>

      {/* AgendaQuickModal */}
      {isAgendaQuickOpen && (
        <AgendaQuickModal
          isOpen={isAgendaQuickOpen}
          onClose={() => {
            setIsAgendaQuickOpen(false);
          }}
          onSuccess={() => {
            setIsAgendaQuickOpen(false);
            void carregarUltimoAgendamento(cliente?.id);
          }}
          cliente={cliente}
        />
      )}
    </>
  );
}
