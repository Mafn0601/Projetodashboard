'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import {
  Box,
  getBoxes,
  getBoxesDisponiveis,
  getTipoBoxPreferidoPorServico,
  addOcupacao,
} from '@/services/boxService';
import { addAgendamento } from '@/services/agendaService';
import {
  getBrasiliaTodayISO,
  getBrasiliaNow,
  getBusinessTimeOptions,
  isPastBrasiliaISODate,
  isSundayISODate,
  timeToMinutes,
  toDdMmFromISODate,
  toISODateFromDdMm,
  toDdMmYyyyFromISODate,
} from '@/lib/dateUtils';
import { readArray } from '@/lib/storage';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (agendamentoId: string) => void;
  dadosOrcamento: {
    nomeCliente: string;
    telefone: string;
    veiculo: string; // Fabricante + Modelo + Versão
    placa: string;
    parceiro: string;
    responsavel: string;
    responsavelId: string;
    tipoOsId: string;
    tipoOsNome: string;
    itemId: string;
    itemNome: string;
    duracao: number;
    formaPagamento?: string;
    meioPagamento?: string;
  };
};

type TipoOS = {
  id: string;
  nome: string;
  itens: Array<{
    id: string;
    nome: string;
    duracao: number;
    tipo: 'servico' | 'produto';
  }>;
};

export default function AgendaOrcamentoModal({
  isOpen,
  onClose,
  onSuccess,
  dadosOrcamento,
}: Props) {
  const [dataIso, setDataIso] = useState(getBrasiliaTodayISO());
  const [horario, setHorario] = useState('');
  const [boxId, setBoxId] = useState('');
  const [erroValidacao, setErroValidacao] = useState('');

  const [boxesDisponiveis, setBoxesDisponiveis] = useState<Box[]>([]);
  const [todosBoxes, setTodosBoxes] = useState<Box[]>([]);
  const [tiposOsList, setTiposOsList] = useState<TipoOS[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const boxes = getBoxes();
    setTodosBoxes(boxes);

    const tipos = readArray<TipoOS>('tiposOs');
    setTiposOsList(tipos);
  }, [isOpen]);

  // Função auxiliar para calcular hora fim
  const calcularHoraFim = (horaInicio: string, duracaoMinutos: number): string => {
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const totalMinutos = horas * 60 + minutos + duracaoMinutos;
    const horasFim = Math.floor(totalMinutos / 60);
    const minutosFim = totalMinutos % 60;
    return `${String(horasFim).padStart(2, '0')}:${String(minutosFim).padStart(2, '0')}`;
  };

  // Calcular horários disponíveis
  const horarioOptionsDisponiveis = getBusinessTimeOptions(dadosOrcamento.duracao, 15).filter((opt) => {
    if (!dataIso || !dadosOrcamento.tipoOsNome) return false;

    const dataEscolhida = dataIso;
    const horaInicio = opt.value;
    const duracaoMin = dadosOrcamento.duracao;

    if (isPastBrasiliaISODate(dataEscolhida)) return false;
    if (isSundayISODate(dataEscolhida)) return false;

    // Se a data escolhida for hoje, verificar se o horário já passou
    const hoje = getBrasiliaTodayISO();
    if (dataEscolhida === hoje) {
      const agora = getBrasiliaNow();
      const horaAtual = agora.getHours();
      const minutoAtual = agora.getMinutes();
      const minutosAgora = horaAtual * 60 + minutoAtual;
      const minutosSlot = timeToMinutes(horaInicio);
      
      // Se o horário do slot já passou, não mostrar
      if (minutosSlot <= minutosAgora) {
        return false;
      }
    }

    const inicioMinutos = timeToMinutes(horaInicio);
    const fimMinutos = inicioMinutos + duracaoMin;

    if (fimMinutos > 18 * 60) return false;

    const tipoBoxPreferido = getTipoBoxPreferidoPorServico(dadosOrcamento.tipoOsNome);
    const horaFim = calcularHoraFim(horaInicio, duracaoMin);
    const dataCompleta = toDdMmYyyyFromISODate(dataEscolhida);
    const boxesLivres = getBoxesDisponiveis(
      dataCompleta,
      horaInicio,
      dataCompleta,
      horaFim,
      tipoBoxPreferido
    );

    return boxesLivres.length > 0;
  });

  // Atualizar boxes disponíveis quando data ou horário mudam
  useEffect(() => {
    if (!dataIso || !horario || !dadosOrcamento.tipoOsNome) {
      setBoxesDisponiveis([]);
      return;
    }

    const tipoBoxPreferido = getTipoBoxPreferidoPorServico(dadosOrcamento.tipoOsNome);
    const horaFim = calcularHoraFim(horario, dadosOrcamento.duracao);
    const dataCompleta = toDdMmYyyyFromISODate(dataIso);
    const boxes = getBoxesDisponiveis(
      dataCompleta,
      horario,
      dataCompleta,
      horaFim,
      tipoBoxPreferido
    );
    setBoxesDisponiveis(boxes);

    // Se o box selecionado não está mais disponível, limpar
    if (boxId && !boxes.some((b) => b.id === boxId)) {
      setBoxId('');
    }
  }, [dataIso, horario, dadosOrcamento.tipoOsNome, dadosOrcamento.duracao, boxId]);

  const handleSalvar = () => {
    setErroValidacao('');

    // Validações
    if (!dataIso) {
      setErroValidacao('Selecione uma data');
      return;
    }

    if (!horario) {
      setErroValidacao('Selecione um horário');
      return;
    }

    if (!boxId) {
      setErroValidacao('Selecione um box');
      return;
    }

    try {
      const boxSelecionado = todosBoxes.find((b) => b.id === boxId);
      const horaFim = calcularHoraFim(horario, dadosOrcamento.duracao);
      const dataCurta = toDdMmFromISODate(dataIso);
      const dataCompleta = toDdMmYyyyFromISODate(dataIso);

      // Criar agendamento
      const novoAgendamento = addAgendamento({
        titulo: `${dadosOrcamento.veiculo}`,
        cliente: dadosOrcamento.nomeCliente,
        telefone: dadosOrcamento.telefone,
        placa: dadosOrcamento.placa,
        data: dataCurta,
        horario,
        duracaoEstimada: dadosOrcamento.duracao,
        responsavel: dadosOrcamento.responsavel,
        tipo: dadosOrcamento.tipoOsNome,
        boxId: boxId,
        boxNome: boxSelecionado?.nome || '',
        tag: 'EXTERNO',
        formaPagamento: dadosOrcamento.formaPagamento || '',
        meioPagamento: dadosOrcamento.meioPagamento || '',
      });

      // Criar ocupação do box
      addOcupacao({
        boxId: boxId,
        boxNome: boxSelecionado?.nome || '',
        referencia: novoAgendamento.id,
        tipoReferencia: 'agendamento',
        cliente: dadosOrcamento.nomeCliente,
        veiculo: dadosOrcamento.veiculo,
        dataInicio: dataCompleta,
        horaInicio: horario,
        dataFim: dataCompleta,
        horaFim,
        status: 'agendado',
      });

      onSuccess(novoAgendamento.id);
      onClose();
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      setErroValidacao('Erro ao criar agendamento. Tente novamente.');
    }
  };

  const handleFechar = () => {
    setDataIso(getBrasiliaTodayISO());
    setHorario('');
    setBoxId('');
    setErroValidacao('');
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleFechar}
      title="Agendar Ordem de Serviço"
      className="max-w-2xl"
      showFooter={false}
    >
      <div className="space-y-6">
        {/* Informações do Orçamento (Read-only) */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3">
            Informações do Orçamento
          </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-600 dark:text-slate-400">Cliente</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {dadosOrcamento.nomeCliente}
              </p>
            </div>
            <div>
                <p className="text-slate-600 dark:text-slate-400">Veículo</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {dadosOrcamento.veiculo}
              </p>
            </div>
            <div>
                <p className="text-slate-600 dark:text-slate-400">Placa</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {dadosOrcamento.placa}
              </p>
            </div>
            <div>
                <p className="text-slate-600 dark:text-slate-400">Responsável</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {dadosOrcamento.responsavel}
              </p>
            </div>
            <div>
              <p className="text-slate-600 dark:text-slate-400">Tipo de OS</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {dadosOrcamento.tipoOsNome}
              </p>
            </div>
            <div>
              <p className="text-slate-600 dark:text-slate-400">Item</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {dadosOrcamento.itemNome}
              </p>
            </div>
            <div>
              <p className="text-slate-600 dark:text-slate-400">Duração</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {Math.floor(dadosOrcamento.duracao / 60)}h{' '}
                {dadosOrcamento.duracao % 60 > 0 ? `${dadosOrcamento.duracao % 60}min` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Campos de Agendamento */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Escolha Data, Horário e Box
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Data"
              type="date"
              value={dataIso}
              onChange={(e) => {
                setDataIso(e.target.value);
                setHorario('');
                setBoxId('');
              }}
              min={getBrasiliaTodayISO()}
              required
            />

            <Select
              label="Horário"
              value={horario}
              onChange={(value) => {
                setHorario(value);
                setBoxId('');
              }}
              options={horarioOptionsDisponiveis}
              disabled={!dataIso}
              placeholder={dataIso ? 'Selecione um horário' : 'Selecione uma data primeiro'}
              required
            />
          </div>

          <Select
            label="Box"
            value={boxId}
            onChange={setBoxId}
            options={boxesDisponiveis.map((b) => ({
              value: b.id,
              label: `${b.nome} - ${b.tipo}`,
            }))}
            disabled={!horario || boxesDisponiveis.length === 0}
            placeholder={
              !horario
                ? 'Selecione data e horário primeiro'
                : boxesDisponiveis.length === 0
                ? 'Nenhum box disponível para este horário'
                : 'Selecione um box'
            }
            required
          />

          {horario && boxId && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Horário agendado:</strong> {horario} até{' '}
                {calcularHoraFim(horario, dadosOrcamento.duracao)}
              </p>
            </div>
          )}
        </div>

        {/* Mensagem de erro */}
        {erroValidacao && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-900 dark:text-red-100">{erroValidacao}</p>
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button variant="secondary" onClick={handleFechar} size="sm">
            Cancelar
          </Button>
          <Button onClick={handleSalvar} size="sm" disabled={!boxId || !horario || !dataIso}>
            Confirmar Agendamento
          </Button>
        </div>
      </div>
    </Modal>
  );
}
