'use client';

import React, { useState, useEffect } from 'react';
import { MaskedInput } from '@/components/ui/MaskedInput';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/AuthContext';
import * as clienteService from '@/services/clienteService';
import { clienteServiceAPI } from '@/services/clienteServiceAPI';
import { equipeServiceAPI } from '@/services/equipeServiceAPI';
import { parceiroServiceAPI } from '@/services/parceiroServiceAPI';
import tipoOSServiceAPI from '@/services/tipoOSServiceAPI';
import { veiculoServiceAPI } from '@/services/veiculoServiceAPI';
import { agendamentoServiceAPI } from '@/services/agendamentoServiceAPI';
import { addAgendamento, getAgendamentos } from '@/services/agendaService';
import { getBoxes, getBoxesDisponiveis, getTipoBoxPreferidoPorServico } from '@/services/boxService';
import { validateForm } from '@/lib/validation';
import { readArray } from '@/lib/storage';
import {
  timeToMinutes,
  toDdMmFromISODate,
  toDdMmYyyyFromISODate,
  isWithinBusinessHours,
  isPastBrasiliaISODate,
  isSundayISODate,
} from '@/lib/dateUtils';
import {
  mockFabricantes,
  getModelosPorFabricante,
  getMockHorarios
} from '@/lib/mockFormData';

type TipoOSItem = {
  id: string;
  nome: string;
  preco: number;
  desconto: number;
  tipo: 'servico' | 'produto' | 'SERVICO' | 'PRODUTO';
  duracao: number;
};

type TipoOS = {
  id: string;
  nome: string;
  descricao?: string;
  itens: TipoOSItem[];
  [key: string]: unknown;
};

type Parceiro = {
  id: string;
  nome: string;
  [key: string]: unknown;
};

type Equipe = {
  id: string;
  nome: string;
  login: string;
  parceiroId?: string;
  parceiro?: string; // Compatibilidade com dados antigos do localStorage
  [key: string]: unknown;
};

type ClienteFormProps = {
  initial?: clienteService.ClienteCompleto;
  onSaved: (cliente?: clienteService.ClienteCompleto) => void;
  onCancel?: () => void;
};

type AgendamentoSelecionado = {
  tipoOSId: string;
  itemOSId: string;
  tipoNome: string;
  itemNome: string;
  itemTipo: string;
  duracao?: number;
};

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function getLocalDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ClienteForm({ initial, onSaved, onCancel }: ClienteFormProps) {
  const { user } = useAuth();
  // Form State
  const [formData, setFormData] = useState({
    responsavel: initial?.responsavel || '',
    parceiro: initial?.parceiro || '',
    // para compatibilidade, preenchido pelo nomeCliente
    nome: initial?.nome || initial?.nomeCliente || '',
    nomeCliente: initial?.nomeCliente || initial?.nome || '',
    // email principal não usado, guardado via emailCliente
    email: initial?.email || initial?.emailCliente || '',
    emailCliente: initial?.emailCliente || initial?.email || '',
    cpfCnpj: initial?.cpfCnpj || '',
    telefone: initial?.telefone || '',
    placaChassi: initial?.placaChassi || initial?.placa || initial?.chassi || '',
    placa: initial?.placa || '',
    chassi: initial?.chassi || '',
    tipoAgendamento: initial?.tipoAgendamento || '',
    tipo: initial?.tipo || '',
    fabricante: initial?.fabricante || '',
    modelo: initial?.modelo || '',
    cor: initial?.cor || '',
    dataAgendamento: initial?.dataAgendamento || '',
    horarioAgendamento: initial?.horarioAgendamento || '',
    boxId: initial?.boxId || '',
    descricaoServico: initial?.descricaoServico || '',
    formaPagamento: initial?.formaPagamento || '',
    meioPagamento: initial?.meioPagamento || '',
    origemPedido: initial?.origemPedido || 'EXTERNO',
  });

  // Error State
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  // Dynamic Data
  const [modelosDisponiveis, setModelosDisponiveis] = useState<SelectOption[]>([]);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<SelectOption[]>([]);
  const [parceiroOptions, setParceiroOptions] = useState<SelectOption[]>([]);
  const [responsavelOptions, setResponsavelOptions] = useState<SelectOption[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [tiposOs, setTiposOs] = useState<TipoOS[]>([]);
  const [tiposOsOptions, setTiposOsOptions] = useState<SelectOption[]>([]);
  const [tipoItemOptions, setTipoItemOptions] = useState<SelectOption[]>([]);
  const [agendamentosSelecionados, setAgendamentosSelecionados] = useState<AgendamentoSelecionado[]>([]);
  const [boxes, setBoxes] = useState<Array<{id: string; nome: string; ativo: boolean; parceiro: string; tipo: 'lavagem' | 'servico_geral'}>>([]);

  // Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);

  const minDate = getLocalDateInputValue(new Date());

  const isUuid = (value?: string): boolean => {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  };

  const normalizeHorario = (horario: string): string => {
    if (!horario) return '';
    const match = horario.match(/hora_(\d+)/);
    if (match && match[1]) {
      const hora = String(parseInt(match[1], 10)).padStart(2, '0');
      return `${hora}:00`;
    }
    const hhmm = horario.match(/^\d{2}:\d{2}$/);
    if (hhmm) return horario;
    return '';
  };

  const parsePlacaChassi = (placaChassi: string): { placa?: string; chassi?: string } => {
    const raw = placaChassi.trim().toUpperCase();
    const clean = raw.replace(/[^A-Z0-9]/g, '');
    const isChassi = clean.length >= 15;

    if (isChassi) {
      return { chassi: clean };
    }

    const placa = raw.includes('-') ? raw : clean;
    return { placa };
  };

  useEffect(() => {
    if (initial) {
      setFormData({
        responsavel: initial.responsavel || '',
        parceiro: initial.parceiro || '',
        nome: initial.nome || initial.nomeCliente || '',
        nomeCliente: initial.nomeCliente || initial.nome || '',
        email: initial.email || initial.emailCliente || '',
        emailCliente: initial.emailCliente || initial.email || '',
        cpfCnpj: initial.cpfCnpj || '',
        telefone: initial.telefone || '',
        placaChassi: initial.placaChassi || initial.placa || initial.chassi || '',
        placa: initial.placa || '',
        chassi: initial.chassi || '',
        tipoAgendamento: initial.tipoAgendamento || '',
        tipo: initial.tipo || '',
        fabricante: initial.fabricante || '',
        modelo: initial.modelo || '',
        cor: initial.cor || '',
        dataAgendamento: initial.dataAgendamento || '',
        horarioAgendamento: initial.horarioAgendamento || '',
        boxId: initial.boxId || '',
        descricaoServico: initial.descricaoServico || '',
          formaPagamento: initial.formaPagamento || '',
          meioPagamento: initial.meioPagamento || '',
          origemPedido: initial.origemPedido || 'EXTERNO',
      });
    } else {
      setFormData({
        responsavel: '',
        parceiro: '',
        nome: '',
        nomeCliente: '',
        email: '',
        emailCliente: '',
        cpfCnpj: '',
        telefone: '',
        placaChassi: '',
        placa: '',
        chassi: '',
        tipoAgendamento: '',
        tipo: '',
        fabricante: '',
        modelo: '',
        cor: '',
        dataAgendamento: '',
        horarioAgendamento: '',
        boxId: '',
        descricaoServico: '',
          formaPagamento: '',
          meioPagamento: '',
          origemPedido: 'EXTERNO',
      });
    }
    setErrors({});
    setAgendamentosSelecionados(
      initial?.tipoAgendamento && initial?.tipo
        ? [{
            tipoOSId: initial.tipoAgendamento,
            itemOSId: initial.tipo,
            tipoNome: initial.tipoAgendamento,
            itemNome: initial.tipo,
            itemTipo: '-',
          }]
        : []
    );
  }, [initial]);

  /**
   * Carregar parceiros, equipes e tipos de OS da API
   */
  const carregarDados = async () => {
    try {
      console.log('🔄 Carregando parceiros e equipes da API...');
      
      // Carregar parceiros e equipes em paralelo
      const [parceirosData, equipesData] = await Promise.all([
        parceiroServiceAPI.findAll(),
        equipeServiceAPI.findAll()
      ]);

      console.log('✅ Dados carregados:', {
        parceiros: parceirosData.length,
        equipes: equipesData.length
      });

      const options: SelectOption[] = parceirosData.map((p) => ({
        value: p.id,
        label: p.nome
      }));
      setParceiroOptions(options);
      setEquipes(equipesData as unknown as Equipe[]);

      // Carregar Tipos de OS da API (com fallback)
      const tiposOsApi = await tipoOSServiceAPI.findAll({ preferCache: true });
      const tiposOsData = (tiposOsApi as unknown as TipoOS[]).map((tipo) => ({
        ...tipo,
        itens: (tipo.itens || []).map((item) => ({
          ...item,
          tipo: item.tipo === 'SERVICO' ? 'servico' : item.tipo === 'PRODUTO' ? 'produto' : item.tipo,
        })),
      }));
      setTiposOs(tiposOsData);
      const tiposOsOpts: SelectOption[] = tiposOsData.map((t) => ({
        value: t.id,
        label: t.nome
      }));
      setTiposOsOptions(tiposOsOpts);

      // Carregar Boxes
      const boxesData = getBoxes().filter(b => b.ativo);
      setBoxes(boxesData);
    } catch (error) {
      console.error('❌ Erro ao carregar dados da API:', error);
      console.warn('⚠️ Tentando fallback para localStorage...');
      try {
        // Fallback para localStorage se API falhar
        const parceiros = readArray<Parceiro>('parceiros');
        setParceiroOptions(parceiros.map((p) => ({ value: p.id, label: p.nome })));
        
        const equipesData = readArray<Equipe>('equipes');
        setEquipes(equipesData);
        
        const tiposOsData = readArray<TipoOS>('tiposOs');
        setTiposOs(tiposOsData);
        setTiposOsOptions(tiposOsData.map((t) => ({ value: t.id, label: t.nome })));
        
        console.log('📦 Dados carregados do localStorage:', {
          parceiros: parceiros.length,
          equipes: equipesData.length
        });
      } catch (storageError) {
        console.error('❌ Erro ao carregar dados do localStorage:', storageError);
      }
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Recarregar dados quando a página ganha foco (volta de outra página)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('ℹ️ Página ganhou foco, recarregando parceiros e equipes...');
        carregarDados();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  /**
   * Atualizar responsáveis quando parceiro mudar
   */
  useEffect(() => {
    if (equipes.length > 0) {
      atualizarResponsaveis(formData.parceiro, equipes);
    }
  }, [formData.parceiro, equipes]);

  /**
   * Atualizar itens quando tipoAgendamento ou tiposOs mudar
   */
  useEffect(() => {
    if (!formData.tipoAgendamento || tiposOs.length === 0) {
      setTipoItemOptions([]);
      return;
    }
    
    // Buscar no state tiposOs (já carregado)
    const tipoSelecionado = tiposOs.find(t => t.id === formData.tipoAgendamento);
    const itens = tipoSelecionado?.itens ?? [];
    
    const itensOptions: SelectOption[] = itens.map((item) => ({
      value: item.id,
      label: `${item.nome} (${item.tipo === 'servico' ? 'Serviço' : 'Produto'})`
    }));
    
    setTipoItemOptions(itensOptions);
  }, [formData.tipoAgendamento, tiposOs]);

  const atualizarResponsaveis = (parceiroId: string, equipesData: Equipe[]) => {
    console.log('🔍 Filtrando responsáveis:', {
      parceiroSelecionado: parceiroId,
      totalEquipes: equipesData.length,
      equipes: equipesData.map(e => ({ id: e.id, nome: e.nome, parceiroId: e.parceiroId || e.parceiro }))
    });
    
    // Compatibilidade: aceita tanto parceiroId (API) quanto parceiro (localStorage antigo)
    const equipasFiltradas = equipesData.filter(e => 
      (e.parceiroId === parceiroId) || (e.parceiro === parceiroId)
    );
    
    console.log('✅ Responsáveis filtrados:', equipasFiltradas.length);
    
    const options: SelectOption[] = equipasFiltradas.map((e) => ({
      value: e.id,
      label: e.nome || e.login
    }));
    setResponsavelOptions(options);
  };

  const adicionarTipoItemSelecionado = () => {
    if (!formData.tipoAgendamento || !formData.tipo) {
      setErrors((prev) => ({
        ...prev,
        tipoAgendamento: !formData.tipoAgendamento ? 'Selecione o tipo de OS' : prev.tipoAgendamento,
        tipo: !formData.tipo ? 'Selecione o item' : prev.tipo,
      }));
      return;
    }

    const tipoSelecionado = tiposOs.find((t) => t.id === formData.tipoAgendamento);
    const itemSelecionado = tipoSelecionado?.itens?.find((item) => item.id === formData.tipo);

    if (!tipoSelecionado || !itemSelecionado) return;

    setAgendamentosSelecionados((prev) => {
      const jaExiste = prev.some(
        (item) => item.tipoOSId === tipoSelecionado.id && item.itemOSId === itemSelecionado.id
      );
      if (jaExiste) return prev;

      return [
        ...prev,
        {
          tipoOSId: tipoSelecionado.id,
          itemOSId: itemSelecionado.id,
          tipoNome: tipoSelecionado.nome,
          itemNome: itemSelecionado.nome,
          itemTipo:
            itemSelecionado.tipo === 'servico' || itemSelecionado.tipo === 'SERVICO'
              ? 'Serviço'
              : 'Produto',
          duracao: itemSelecionado.duracao,
        },
      ];
    });
  };

  const removerTipoItemSelecionado = (tipoOSId: string, itemOSId: string) => {
    setAgendamentosSelecionados((prev) =>
      prev.filter((item) => !(item.tipoOSId === tipoOSId && item.itemOSId === itemOSId))
    );
  };



  /**
   * Carregar modelos quando fabricante mudar
   */
  useEffect(() => {
    if (formData.fabricante) {
      const modelos = getModelosPorFabricante(formData.fabricante);
      setModelosDisponiveis(modelos);
      const modeloValido = modelos.some((m) => m.value === formData.modelo);
      if (!modeloValido && formData.modelo) {
        setFormData(prev => ({ ...prev, modelo: '' }));
      }
    } else {
      setModelosDisponiveis([]);
      if (formData.modelo) {
        setFormData(prev => ({ ...prev, modelo: '' }));
      }
    }
  }, [formData.fabricante]);

  /**
   * Carregar horários quando data mudar
   */
  useEffect(() => {
    if (formData.dataAgendamento) {
      const horarios = getMockHorarios(formData.dataAgendamento);
      setHorariosDisponiveis(horarios);
      const horarioValido = horarios.some((h) => h.value === formData.horarioAgendamento);
      if (!horarioValido && formData.horarioAgendamento) {
        setFormData(prev => ({ ...prev, horarioAgendamento: '' }));
      }
    } else {
      setHorariosDisponiveis([]);
      if (formData.horarioAgendamento) {
        setFormData(prev => ({ ...prev, horarioAgendamento: '' }));
      }
    }
  }, [formData.dataAgendamento]);

  /**
   * Manipular mudança de campos
   */
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Se mudou o tipo de OS, limpar o campo item
      if (field === 'tipoAgendamento') {
        newData.tipo = '';
      }
      
      return newData;
    });
    
    // Limpar erro do campo quando o usuário começar a escrever
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  /**
   * Submeter formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar formulário
    const { isValid, errors: validationErrors } = validateForm(formData);

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const tipoPadrao = tiposOs.find((t) => t.id === formData.tipoAgendamento);
      const itemPadrao = tipoPadrao?.itens?.find((item) => item.id === formData.tipo);
      const paresAgendamento =
        agendamentosSelecionados.length > 0
          ? agendamentosSelecionados
          : formData.tipoAgendamento && formData.tipo
            ? [{
                tipoOSId: formData.tipoAgendamento,
                itemOSId: formData.tipo,
                tipoNome: tipoPadrao?.nome || formData.tipoAgendamento,
                itemNome: itemPadrao?.nome || formData.tipo,
                itemTipo:
                  itemPadrao?.tipo === 'servico' || itemPadrao?.tipo === 'SERVICO' ? 'Serviço' : 'Produto',
                duracao: itemPadrao?.duracao,
              }]
            : [];

      const primeiroPar = paresAgendamento[0];

      const cliente: clienteService.ClienteCompleto = {
        id: initial?.id || generateId('cli'),
        ...formData,
        tipoAgendamento: primeiroPar?.tipoOSId || formData.tipoAgendamento,
        tipo: primeiroPar?.itemOSId || formData.tipo,
        formaPagamento: formData.meioPagamento,
        meioPagamento: formData.formaPagamento,
        // garantir campos principais preenchidos corretamente
        nome: formData.nomeCliente,
        email: formData.emailCliente,
        dataCriacao: initial?.dataCriacao || new Date().toISOString(),
        dataAtualizacao: new Date().toISOString(),
      };

      let resultado;
      if (initial?.id) {
        console.log('📤 Atualizando cliente via API...');
        resultado = await clienteServiceAPI.update(initial.id, cliente);
      } else {
        console.log('📤 Criando cliente via API...');
        resultado = await clienteServiceAPI.create(cliente);
      }

      if (resultado) {
        const clienteId = resultado.id;
        const horarioNormalizado = normalizeHorario(formData.horarioAgendamento);

        const { placa, chassi } = parsePlacaChassi(formData.placaChassi);
        if (clienteId && placa) {
          const veiculosExistentes = await veiculoServiceAPI.findAll({ clienteId, take: 1 });
          const payloadVeiculo = {
            clienteId,
            placa,
            chassi,
            marca: formData.fabricante || 'NÃO INFORMADO',
            modelo: formData.modelo || 'NÃO INFORMADO',
            fabricante: formData.fabricante || undefined,
            cor: formData.cor || undefined,
          };

          if (veiculosExistentes.length > 0) {
            await veiculoServiceAPI.update(veiculosExistentes[0].id, payloadVeiculo);
          } else {
            await veiculoServiceAPI.create(payloadVeiculo);
          }
        }

        if (clienteId && formData.dataAgendamento && horarioNormalizado && paresAgendamento.length > 0) {
          const responsavelId = isUuid(user?.id) ? user?.id : (isUuid(formData.responsavel) ? formData.responsavel : undefined);
          const parceiroId = isUuid(formData.parceiro) ? formData.parceiro : undefined;

          if (responsavelId) {
            // Validar disponibilidade do horário antes de criar agendamentos
            const dataISO = formData.dataAgendamento; // formato YYYY-MM-DD
            
            // Validações de data
            if (isPastBrasiliaISODate(dataISO)) {
              setErrors({ ...errors, dataAgendamento: 'Não é permitido agendar em dias passados.' });
              setIsSubmitting(false);
              return;
            }

            if (isSundayISODate(dataISO)) {
              setErrors({ ...errors, dataAgendamento: 'Domingo é uma data inválida para agendamento.' });
              setIsSubmitting(false);
              return;
            }

            // Validar cada agendamento antes de criar
            for (const itemSelecionado of paresAgendamento) {
              const duracao = itemSelecionado.duracao || 60;

              // Verificar horário comercial
              if (!isWithinBusinessHours(horarioNormalizado, duracao)) {
                setErrors({ ...errors, horarioAgendamento: 'Horário inválido. Atendemos de 08:00 às 18:00 e fechamos para almoço de 12:00 às 13:30.' });
                setIsSubmitting(false);
                return;
              }

              // Verificar conflitos de horário
              const dataCurta = toDdMmFromISODate(dataISO);
              const inicioMinutos = timeToMinutes(horarioNormalizado);
              const fimMinutos = inicioMinutos + duracao;

              const isConflitoHorario = (inicioA: number, fimA: number, inicioB: number, fimB: number): boolean => {
                return inicioA < fimB && fimA > inicioB;
              };

              const agendamentosConflitantes = getAgendamentos().filter((agendamentoAtual) => {
                if (agendamentoAtual.data !== dataCurta) return false;
                const inicioAg = timeToMinutes(agendamentoAtual.horario);
                const fimAg = inicioAg + (agendamentoAtual.duracaoEstimada || 60);
                return isConflitoHorario(inicioMinutos, fimMinutos, inicioAg, fimAg);
              });

              // Verificar boxes disponíveis
              const dataCompleta = toDdMmYyyyFromISODate(dataISO);
              const calcularHoraFim = (horaInicio: string, duracaoMinutos: number): string => {
                const [horas, minutos] = horaInicio.split(':').map(Number);
                const totalMinutos = horas * 60 + minutos + duracaoMinutos;
                const horasFim = Math.floor(totalMinutos / 60);
                const minutosFim = totalMinutos % 60;
                return `${String(horasFim).padStart(2, '0')}:${String(minutosFim).padStart(2, '0')}`;
              };
              const horaFim = calcularHoraFim(horarioNormalizado, duracao);
              const tipoBoxPreferido = getTipoBoxPreferidoPorServico(itemSelecionado.tipoNome);
              const boxesLivres = getBoxesDisponiveis(
                dataCompleta,
                horarioNormalizado,
                dataCompleta,
                horaFim,
                tipoBoxPreferido
              );

              if (boxesLivres.length === 0) {
                setErrors({ ...errors, horarioAgendamento: `Não há boxes disponíveis para ${itemSelecionado.tipoNome} às ${horarioNormalizado}.` });
                setIsSubmitting(false);
                return;
              }

              // Verificar se há capacidade (considerando agendamentos conflitantes)
              const boxesCompativeis = boxesLivres;
              if (agendamentosConflitantes.length >= boxesCompativeis.length) {
                setErrors({ ...errors, horarioAgendamento: `Sem vagas disponíveis para ${itemSelecionado.tipoNome} às ${horarioNormalizado} (${agendamentosConflitantes.length} agendamentos já confirmados).` });
                setIsSubmitting(false);
                return;
              }
            }

            // Se passou todas as validações, criar os agendamentos
            const dataAgendamentoISO = new Date(`${formData.dataAgendamento}T${horarioNormalizado}:00`).toISOString();

            for (const itemSelecionado of paresAgendamento) {
              const novoAgendamento = await agendamentoServiceAPI.create({
                clienteId,
                responsavelId,
                parceiroId: parceiroId || undefined,
                dataAgendamento: dataAgendamentoISO,
                horarioAgendamento: horarioNormalizado,
                tipoAgendamento: itemSelecionado.tipoOSId,
                status: 'CONFIRMADO',
                tipoOSId: itemSelecionado.tipoOSId,
                itemOSId: itemSelecionado.itemOSId,
                duracao: itemSelecionado.duracao,
                descricaoServico: formData.descricaoServico || undefined,
              });

              if (!novoAgendamento) {
                throw new Error('Falha ao criar agendamento na API');
              }

              window.dispatchEvent(new Event('agendamento:novo'));

              addAgendamento({
                titulo: `${String(new Date().getFullYear()).slice(-2)} ${formData.fabricante || 'VEÍCULO'} - ${formData.modelo || 'MODELO'}`,
                placa: placa || 'SEM-PLACA',
                responsavel: formData.responsavel || user?.name || 'Responsável',
                cliente: formData.nomeCliente || formData.nome || 'Cliente',
                telefone: formData.telefone || '',
                tipo: `${itemSelecionado.tipoNome} • ${itemSelecionado.itemNome}`,
                tag: formData.origemPedido,
                horario: horarioNormalizado,
                data: formData.dataAgendamento.split('-').reverse().slice(0, 2).join('/'),
                clienteId,
                formaPagamento: formData.meioPagamento || undefined,
                meioPagamento: formData.formaPagamento || undefined,
              });
            }
          }
        }

        const clienteComDados: clienteService.ClienteCompleto = {
          ...resultado,
          ...formData,
          tipoAgendamento: primeiroPar?.tipoOSId || formData.tipoAgendamento,
          tipo: primeiroPar?.itemOSId || formData.tipo,
          formaPagamento: formData.meioPagamento,
          meioPagamento: formData.formaPagamento,
          nome: formData.nomeCliente,
          email: formData.emailCliente,
        };

        console.log('✅ Cliente salvo com sucesso:', resultado);
        onSaved(clienteComDados);
      } else {
        throw new Error('Erro ao salvar cliente - resposta vazia');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar cliente:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seção 1: Informações Básicas */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Informações Básicas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Responsável (Equipe)"
            options={responsavelOptions}
            value={formData.responsavel}
            onChange={(value) => handleFieldChange('responsavel', value)}
            error={errors.responsavel || undefined}
            placeholder="Selecione um responsável"
            required
            disabled={!formData.parceiro}
          />

          <Select
            label="Parceiro"
            options={parceiroOptions}
            value={formData.parceiro}
            onChange={(value) => handleFieldChange('parceiro', value)}
            error={errors.parceiro || undefined}
            placeholder="Selecione um parceiro"
            required
          />

          <Input
            label="Nome do Cliente"
            placeholder="Nome do cliente"
            value={formData.nomeCliente}
            onChange={(e) => handleFieldChange('nomeCliente', e.target.value)}
            required
          />

          <MaskedInput
            label="CPF/CNPJ"
            mask="cpfCnpj"
            placeholder="000.000.000-00 ou 00.000.000/0000-00"
            value={formData.cpfCnpj}
            onChange={(value) => handleFieldChange('cpfCnpj', value)}
            error={errors.cpfCnpj || undefined}
            required
          />
        </div>
      </div>

      {/* Seção 2: Contato */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Contato</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MaskedInput
            label="Telefone"
            mask="phone"
            placeholder="(11) 99999-9999"
            value={formData.telefone}
            onChange={(value) => handleFieldChange('telefone', value)}
            error={errors.telefone || undefined}
            required
          />

          <Input
            label="Email do Cliente"
            type="email"
            placeholder="cliente@empresa.com"
            value={formData.emailCliente}
            onChange={(e) => handleFieldChange('emailCliente', e.target.value)}
            error={errors.emailCliente || undefined}
            required
          />
        </div>
      </div>

      {/* Seção 3: Veículo */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Informações do Veículo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Fabricante"
            options={mockFabricantes}
            value={formData.fabricante}
            onChange={(value) => handleFieldChange('fabricante', value)}
            error={errors.fabricante || undefined}
            placeholder="Selecione o fabricante"
            required
          />

          <Select
            label="Modelo"
            options={modelosDisponiveis}
            value={formData.modelo}
            onChange={(value) => handleFieldChange('modelo', value)}
            error={errors.modelo || undefined}
            placeholder={formData.fabricante ? "Selecione o modelo" : "Selecione um fabricante para carregar os modelos"}
            disabled={!formData.fabricante}
            required
          />

          <MaskedInput
            label="Placa/Chassi"
            mask="placaChassi"
            placeholder="ABC-1234 ou 9BWZZZ377VT004251"
            value={formData.placaChassi}
            onChange={(value) => handleFieldChange('placaChassi', value)}
            error={errors.placaChassi || undefined}
            required
          />

          <Input
            label="Cor"
            type="text"
            placeholder="Ex: Branco, Preto, Prata"
            value={formData.cor}
            onChange={(e) => handleFieldChange('cor', e.target.value)}
            error={errors.cor || undefined}
          />
        </div>
      </div>

      {/* Seção 4: Tipo de OS */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Serviços/Produtos</h3>
        <div className="space-y-4">
          {/* Tipo de OS e Item */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo de OS"
              options={tiposOsOptions}
              value={formData.tipoAgendamento}
              onChange={(value) => handleFieldChange('tipoAgendamento', value)}
              error={errors.tipoAgendamento || undefined}
              placeholder="Selecione o tipo"
              required
            />

            <Select
              label="Item"
              options={tipoItemOptions}
              value={formData.tipo}
              onChange={(value) => handleFieldChange('tipo', value)}
              error={errors.tipo || undefined}
              placeholder={formData.tipoAgendamento ? "Selecione o item" : "Selecione um Tipo de OS primeiro"}
              disabled={!formData.tipoAgendamento || tipoItemOptions.length === 0}
              required
            />
          </div>

          {/* Botão Adicionar */}
          <Button
            type="button"
            className="w-full"
            onClick={adicionarTipoItemSelecionado}
            disabled={!formData.tipoAgendamento || !formData.tipo}
          >
            ➕ Adicionar Tipo/Item
          </Button>

          {/* Validação - Aviso */}
          {agendamentosSelecionados.length === 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-400 font-bold text-lg flex-shrink-0">⚠</span>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Selecione pelo menos um tipo/item para continuar
              </p>
            </div>
          )}

          {/* Lista de Tipos/Itens Selecionados */}
          {agendamentosSelecionados.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2">
              {agendamentosSelecionados.map((item) => (
                <div
                  key={`${item.tipoOSId}_${item.itemOSId}`}
                  className="flex items-center justify-between rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {item.tipoNome} - {item.itemNome}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {item.itemTipo}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() => removerTipoItemSelecionado(item.tipoOSId, item.itemOSId)}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Box */}
          <Select
            label="Box"
            options={boxes.map(b => ({ value: b.id, label: b.nome }))}
            value={formData.boxId}
            onChange={(value) => handleFieldChange('boxId', value)}
            placeholder="Selecione um box"
          />

          {/* Data, Horário, Duração em linha */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              label="Data"
              type="date"
              min={minDate}
              value={formData.dataAgendamento}
              onChange={(e) => handleFieldChange('dataAgendamento', e.target.value)}
              error={errors.dataAgendamento || undefined}
              required
            />

            <Select
              label="Horário"
              options={horariosDisponiveis}
              value={formData.horarioAgendamento}
              onChange={(value) => handleFieldChange('horarioAgendamento', value)}
              error={errors.horarioAgendamento || undefined}
              placeholder="Selecione..."
              disabled={!formData.dataAgendamento}
              required
            />

            <Input
              label="Duração (min)"
              type="number"
              min="30"
              max="480"
              value="60"
              onChange={() => {}}
              disabled
            />
          </div>

          {/* Meio de Pagamento e Forma de Pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Meio de Pagamento"
              options={[
                { value: 'TRANSFERENCIA_TED', label: 'TRANSFERENCIA/TED' },
                { value: 'PIX', label: 'PIX' },
                { value: 'DINHEIRO', label: 'DINHEIRO' },
                { value: 'CHEQUE', label: 'CHEQUE' },
                { value: 'A_COMBINAR', label: 'A COMBINAR' },
                { value: 'CARTAO_DEBITO', label: 'CARTÃO DEBITO' },
                { value: 'CARTAO_CREDITO', label: 'CARTÃO CRÉDITO' },
                { value: 'GARANTIA', label: 'GARANTIA' },
                { value: 'PERMUTA', label: 'PERMUTA' },
              ]}
              value={formData.meioPagamento}
              onChange={(value) => handleFieldChange('meioPagamento', value)}
              placeholder="Selecione..."
            />

            <Select
              label="Forma de Pagamento"
              options={[
                { value: 'A_VISTA', label: 'A VISTA' },
                { value: '2_VEZES', label: '2 VEZES' },
                { value: '3_VEZES', label: '3 VEZES' },
                { value: '4_VEZES', label: '4 VEZES' },
                { value: '5_VEZES', label: '5 VEZES' },
                { value: '6_VEZES', label: '6 VEZES' },
              ]}
              value={formData.formaPagamento}
              onChange={(value) => handleFieldChange('formaPagamento', value)}
              placeholder="Selecione..."
            />
          </div>

          {/* Origem do Pedido */}
          <Select
            label="Origem do Pedido"
            options={[
              { value: 'INTERNO', label: 'Interno (da Loja)' },
              { value: 'EXTERNO', label: 'Externo (Fora da Loja)' },
            ]}
            value={formData.origemPedido}
            onChange={(value) => handleFieldChange('origemPedido', value)}
            error={errors.origemPedido || undefined}
            placeholder="Selecione..."
            required
          />
        </div>
      </div>

      {/* Seção 5: Descrição */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Detalhes</h3>
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
            Descrição do Serviço
          </label>
          <textarea
            value={formData.descricaoServico}
            onChange={(e) => handleFieldChange('descricaoServico', e.target.value)}
            placeholder="Descreva o serviço a ser realizado"
            className="w-full h-24 px-3 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          />
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : initial?.id ? 'Atualizar' : 'Salvar'}
        </Button>
      </div>

      {/* Legenda */}
      <div className="text-xs text-slate-700 dark:text-slate-400 flex items-center gap-1">
        <span className="text-red-500">*</span> campos obrigatórios
      </div>
    </form>
  );
}
