'use client';

import React, { useState, useEffect } from 'react';
import { MaskedInput } from '@/components/ui/MaskedInput';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import * as clienteService from '@/services/clienteService';
import { validateForm } from '@/lib/validation';
import { readArray } from '@/lib/storage';
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

type ClienteFormProps = {
  initial?: clienteService.ClienteCompleto;
  onSaved: (cliente?: clienteService.ClienteCompleto) => void;
  onCancel?: () => void;
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

  // Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);

  const minDate = getLocalDateInputValue(new Date());

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
        descricaoServico: initial.descricaoServico || '',
          formaPagamento: initial.formaPagamento || '',
          meioPagamento: initial.meioPagamento || '',
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
        descricaoServico: '',
          formaPagamento: '',
          meioPagamento: '',
      });
    }
    setErrors({});
  }, [initial]);

  /**
   * Carregar parceiros, equipes e tipos de OS do localStorage (apenas uma vez)
   */
  useEffect(() => {
    const parceiros = readArray<Parceiro>('parceiros');
    const options: SelectOption[] = parceiros.map((p) => ({
      value: p.id,
      label: p.nome
    }));
    setParceiroOptions(options);

    const equipesData = readArray<Equipe>('equipes');
    setEquipes(equipesData);

    // Carregar Tipos de OS e setar no state
    const tiposOsData = readArray<TipoOS>('tiposOs');
    setTiposOs(tiposOsData);
    const tiposOsOpts: SelectOption[] = tiposOsData.map((t) => ({
      value: t.id,
      label: t.nome
    }));
    setTiposOsOptions(tiposOsOpts);
  }, []); // Array vazio - executa apenas uma vez

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
    const equipasFiltradas = equipesData.filter(e => e.parceiro === parceiroId);
    const options: SelectOption[] = equipasFiltradas.map((e) => ({
      value: e.id,
      label: e.nome || e.login
    }));
    setResponsavelOptions(options);
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
      
      // Se mudou o tipo de agendamento, limpar o campo tipo
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
      const cliente: clienteService.ClienteCompleto = {
        id: initial?.id || generateId('cli'),
        ...formData,
        // garantir campos principais preenchidos corretamente
        nome: formData.nomeCliente,
        email: formData.emailCliente,
        dataCriacao: initial?.dataCriacao || new Date().toISOString(),
        dataAtualizacao: new Date().toISOString(),
      };

      if (initial?.id) {
        clienteService.updateCompleto(initial.id, cliente);
      } else {
        clienteService.saveCompleto(cliente);
      }

      onSaved(cliente);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
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

      {/* Seção 3: Tipo de Agendamento */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Tipo de Agendamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo Agendamento"
            options={tiposOsOptions}
            value={formData.tipoAgendamento}
            onChange={(value) => handleFieldChange('tipoAgendamento', value)}
            error={errors.tipoAgendamento || undefined}
            placeholder="Selecione o tipo"
            required
          />

          <Select
            label="Tipo"
            options={tipoItemOptions}
            value={formData.tipo}
            onChange={(value) => handleFieldChange('tipo', value)}
            error={errors.tipo || undefined}
            placeholder={formData.tipoAgendamento ? "Selecione o item" : "Selecione o Tipo Agendamento primeiro"}
            disabled={!formData.tipoAgendamento || tipoItemOptions.length === 0}
            required
          />

          <Select
            label="Origem do Pedido"
            options={[
              { value: 'INTERNO', label: 'Interno (da Loja)' },
              { value: 'EXTERNO', label: 'Externo (Fora da Loja)' },
            ]}
            value={formData.origemPedido}
            onChange={(value) => handleFieldChange('origemPedido', value)}
            error={errors.origemPedido || undefined}
            placeholder="Selecione a origem"
            required
          />
        </div>
      </div>

      {/* Seção 4: Veículo */}
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

      {/* Seção 5: Agendamento */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Data e Horário</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Data Agendamento"
            type="date"
            min={minDate}
            value={formData.dataAgendamento}
            onChange={(e) => handleFieldChange('dataAgendamento', e.target.value)}
            error={errors.dataAgendamento || undefined}
            required
          />

          <Select
            label="Horário Agendamento"
            options={horariosDisponiveis}
            value={formData.horarioAgendamento}
            onChange={(value) => handleFieldChange('horarioAgendamento', value)}
            error={errors.horarioAgendamento || undefined}
            placeholder={formData.dataAgendamento ? "Selecione um horário" : "Selecione a data de agendamento para carregar os horários"}
            disabled={!formData.dataAgendamento}
            required
          />
        </div>
      </div>

      {/* Seção 6: Descrição */}
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

      {/* Seção 7: Pagamento */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Informações de Pagamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            placeholder="Selecione a forma de pagamento"
          />

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
            placeholder="Selecione o meio de pagamento"
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
