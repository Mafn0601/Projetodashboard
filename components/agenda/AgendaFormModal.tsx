'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/AuthContext';
import {
  Box,
  getBoxes,
  getBoxesDisponiveis,
  getTipoBoxPreferidoPorServico,
  addOcupacao,
} from '@/services/boxService';
import { AgendaItem, addAgendamento, getAgendamentos, updateAgendamento } from '@/services/agendaService';
import {
  getBrasiliaTodayISO,
  getBrasiliaNow,
  getBrasiliaYear,
  getBusinessTimeOptions,
  isPastBrasiliaISODate,
  isSundayISODate,
  isWithinBusinessHours,
  timeToMinutes,
  toDdMmFromISODate,
  toDdMmYyyyFromISODate,
  toISODateFromDdMm,
} from '@/lib/dateUtils';
import { readArray } from '@/lib/storage';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  agendamento?: AgendaItem | null;
  dataInicial?: string;
};

type TipoOSItem = {
  id: string;
  nome: string;
  duracao: number;
  tipo: 'servico' | 'produto';
  [key: string]: unknown;
};

type TipoOS = {
  id: string;
  nome: string;
  itens: TipoOSItem[];
  [key: string]: unknown;
};

type Equipe = {
  id: string;
  nome: string;
  login: string;
  [key: string]: unknown;
};

export default function AgendaFormModal({
  isOpen,
  onClose,
  onSuccess,
  agendamento,
  dataInicial,
}: Props) {
  const { user } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [placa, setPlaca] = useState('');
  const [cliente, setCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [responsavel, setResponsavel] = useState('');

  const [tipo, setTipo] = useState('');
  const [tipoOsId, setTipoOsId] = useState('');
  const [itemId, setItemId] = useState('');

  const [tag, setTag] = useState<'INTERNO' | 'EXTERNO'>('EXTERNO');
  const [dataIso, setDataIso] = useState(getBrasiliaTodayISO());
  const [horario, setHorario] = useState('');
  const [duracaoEstimada, setDuracaoEstimada] = useState(60);
  const [boxId, setBoxId] = useState('');
  const [erroValidacao, setErroValidacao] = useState('');
    const [formaPagamento, setFormaPagamento] = useState('');
    const [meioPagamento, setMeioPagamento] = useState('');

  const [boxesDisponiveis, setBoxesDisponiveis] = useState<Box[]>([]);
  const [todosBoxes, setTodosBoxes] = useState<Box[]>([]);
  const [tiposOsList, setTiposOsList] = useState<TipoOS[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);

  const limparForm = () => {
    setTitulo('');
    setPlaca('');
    setCliente('');
    setTelefone('');
    setResponsavel('');
    setTipo('');
    setTipoOsId('');
    setItemId('');
    setTag('EXTERNO');
    setDataIso(getBrasiliaTodayISO());
    setHorario('');
    setDuracaoEstimada(60);
    setBoxId('');
    setBoxesDisponiveis([]);
    setErroValidacao('');
      setFormaPagamento('');
      setMeioPagamento('');
  };

  useEffect(() => {
    if (!isOpen) return;

    const boxesAtivos = getBoxes().filter((b) => b.ativo);
    const tipos = readArray<TipoOS>('tiposOs');
    const equipesData = readArray<Equipe>('equipes');

    setTodosBoxes(boxesAtivos);
    setTiposOsList(tipos);
    setEquipes(equipesData);

    if (agendamento) {
      setTitulo(agendamento.titulo);
      setPlaca(agendamento.placa);
      setCliente(agendamento.cliente);
      setTelefone(agendamento.telefone);
      setResponsavel(agendamento.responsavel);
      setTag(agendamento.tag);
      setDataIso(toISODateFromDdMm(agendamento.data));
      setHorario(agendamento.horario);
      setBoxId(agendamento.boxId || '');

      const tipoEncontrado = tipos.find((t) => t.itens?.some((i) => i.nome === agendamento.tipo));
      const itemEncontrado = tipoEncontrado?.itens.find((i) => i.nome === agendamento.tipo);

      setTipoOsId(tipoEncontrado?.id || '');
      setItemId(itemEncontrado?.id || '');
      setTipo(itemEncontrado?.nome || agendamento.tipo);
      setDuracaoEstimada(itemEncontrado?.duracao || agendamento.duracaoEstimada || 60);
        setFormaPagamento(agendamento.formaPagamento || '');
        setMeioPagamento(agendamento.meioPagamento || '');
    } else {
      limparForm();
      if (user) {
        const userEquipe = equipesData.find(e => e.nome === user.name || e.login === user.email);
        setResponsavel(userEquipe?.id || '');
      }
      if (dataInicial) {
        setDataIso(toISODateFromDdMm(dataInicial));
      }
    }
  }, [isOpen, agendamento, dataInicial, user]);

  const tipoSelecionadoAtual = tiposOsList.find((t) => t.id === tipoOsId);
  const itensDisponiveis = tipoSelecionadoAtual?.itens || [];

  const isConflitoHorario = (inicioA: number, fimA: number, inicioB: number, fimB: number): boolean => {
    return inicioA < fimB && fimA > inicioB;
  };

  const tipoPreferidoSelecionado = getTipoBoxPreferidoPorServico(tipo);
  const horarioOptions = getBusinessTimeOptions(duracaoEstimada);
  const horarioOptionsDisponiveis = horarioOptions.filter((option) => {
    if (!dataIso || !tipo) return true;

    const dataCurta = toDdMmFromISODate(dataIso);
    const dataCompleta = converterDataParaCompleta(dataCurta);
    const inicio = timeToMinutes(option.value);
    const fim = inicio + duracaoEstimada;

    // Se a data escolhida for hoje, verificar se o horário já passou
    const hoje = getBrasiliaTodayISO();
    if (dataIso === hoje) {
      const agora = getBrasiliaNow();
      const horaAtual = agora.getHours();
      const minutoAtual = agora.getMinutes();
      const minutosAgora = horaAtual * 60 + minutoAtual;
      
      // Se o horário do slot já passou, não mostrar
      if (inicio <= minutosAgora) {
        return false;
      }
    }

    const boxesCompativeis = todosBoxes.filter(
      (box) => !tipoPreferidoSelecionado || box.tipo === tipoPreferidoSelecionado
    );
    const capacidade = boxesCompativeis.length;
    if (capacidade === 0) return false;

    const agendamentosConflitantes = getAgendamentos().filter((agendamentoAtual) => {
      if (agendamentoAtual.data !== dataCurta) return false;
      if (agendamento?.id && agendamentoAtual.id === agendamento.id) return false;
      const inicioAg = timeToMinutes(agendamentoAtual.horario);
      const fimAg = inicioAg + (agendamentoAtual.duracaoEstimada || 60);
      return isConflitoHorario(inicio, fim, inicioAg, fimAg);
    });

    if (agendamentosConflitantes.length >= capacidade) {
      return false;
    }

    const horaFim = calcularHoraFim(option.value, duracaoEstimada);
    const boxesLivres = getBoxesDisponiveis(
      dataCompleta,
      option.value,
      dataCompleta,
      horaFim,
      tipoPreferidoSelecionado,
      agendamento?.id
    );

    return boxesLivres.length > 0;
  });

  useEffect(() => {
    const itemSelecionado = itensDisponiveis.find((i) => i.id === itemId);
    if (!itemSelecionado) return;

    setTipo(itemSelecionado.nome);
    // Limitar duração entre 45 min (mínimo) e 120 min (máximo)
    const duracaoLimitada = Math.max(45, Math.min(itemSelecionado.duracao || 60, 120));
    setDuracaoEstimada(duracaoLimitada);
  }, [itemId, tipoOsId, tiposOsList]);

  useEffect(() => {
    if (!horario) return;
    if (!horarioOptionsDisponiveis.some((opt) => opt.value === horario)) {
      setHorario('');
    }
  }, [duracaoEstimada, horario, dataIso, tipo, todosBoxes, agendamento?.id]);

  const calcularHoraFim = (horaInicio: string, duracaoMinutos: number): string => {
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const dataInicio = new Date(2000, 0, 1, horas, minutos);
    const dataFim = new Date(dataInicio.getTime() + duracaoMinutos * 60000);
    return `${String(dataFim.getHours()).padStart(2, '0')}:${String(dataFim.getMinutes()).padStart(2, '0')}`;
  };

  const converterDataParaCompleta = (dataSimples: string): string => {
    const ano = getBrasiliaYear();
    return `${dataSimples}/${ano}`;
  };

  const verificarDisponibilidade = () => {
    if (!dataIso || !horario) return;

    if (isPastBrasiliaISODate(dataIso)) {
      setBoxesDisponiveis([]);
      setErroValidacao('Não é permitido agendar em dias passados.');
      return;
    }

    if (isSundayISODate(dataIso)) {
      setBoxesDisponiveis([]);
      setErroValidacao('Domingo é uma data inválida para agendamento.');
      return;
    }

    if (!isWithinBusinessHours(horario, duracaoEstimada)) {
      setBoxesDisponiveis([]);
      setErroValidacao('Horário inválido. Atendemos de 08:00 às 18:00 e fechamos para almoço de 12:00 às 13:30.');
      return;
    }

    if (!horarioOptionsDisponiveis.some((opt) => opt.value === horario)) {
      setBoxesDisponiveis([]);
      setErroValidacao('Sem vagas neste horário considerando agenda e boxes disponíveis.');
      return;
    }

    if (!horarioOptions.some((opt) => opt.value === horario)) {
      setBoxesDisponiveis([]);
      setErroValidacao('Selecione um horário válido da lista de funcionamento.');
      return;
    }

    if (!tipoOsId || !itemId || !tipo) {
      setBoxesDisponiveis([]);
      setErroValidacao('Selecione Tipo de OS e Item para calcular a duração e validar vagas.');
      return;
    }

    const dataCurta = toDdMmFromISODate(dataIso);
    const dataCompleta = converterDataParaCompleta(dataCurta);
    const horaFim = calcularHoraFim(horario, duracaoEstimada);
    const tipoPreferido = tipoPreferidoSelecionado;

    const boxesLivres = getBoxesDisponiveis(
      dataCompleta,
      horario,
      dataCompleta,
      horaFim,
      tipoPreferido,
      agendamento?.id
    );

    setBoxesDisponiveis(boxesLivres);

    if (boxId && !boxesLivres.find((b) => b.id === boxId)) {
      setBoxId('');
    }

    if (boxesLivres.length === 0) {
      setErroValidacao('Não há vagas de box disponíveis para esta tarefa neste horário.');
      return;
    }

    setErroValidacao('');
  };

  useEffect(() => {
    if (isOpen) {
      verificarDisponibilidade();
    }
  }, [isOpen, dataIso, horario, duracaoEstimada, tipoOsId, itemId, tipo, boxId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (erroValidacao) return;

    if (isPastBrasiliaISODate(dataIso) || isSundayISODate(dataIso)) return;

    if (!isWithinBusinessHours(horario, duracaoEstimada)) return;

    if (!tipoOsId || !itemId || !tipo) return;

    if (!boxId) {
      setErroValidacao('Selecione um box para concluir o agendamento.');
      return;
    }

    if (!boxesDisponiveis.some((b) => b.id === boxId)) {
      setErroValidacao('O box selecionado não está disponível para este horário/tarefa.');
      return;
    }

    const dataCurta = toDdMmFromISODate(dataIso);
    const boxSelecionado = todosBoxes.find((b) => b.id === boxId);

    const dadosAgendamento = {
      titulo,
      placa,
      cliente,
      telefone,
      responsavel,
      tipo,
      tag,
      data: dataCurta,
      horario,
      duracaoEstimada,
      boxId,
      boxNome: boxSelecionado?.nome || undefined,
        formaPagamento: formaPagamento || undefined,
        meioPagamento: meioPagamento || undefined,
    };

    if (agendamento) {
      updateAgendamento(agendamento.id, dadosAgendamento);
    } else {
      const novoAgendamento = addAgendamento(dadosAgendamento);

      if (boxId && boxSelecionado) {
        const dataCompleta = toDdMmYyyyFromISODate(dataIso);
        const horaFim = calcularHoraFim(horario, duracaoEstimada);

        addOcupacao({
          boxId,
          boxNome: boxSelecionado.nome,
          referencia: novoAgendamento.id,
          tipoReferencia: 'agendamento',
          cliente,
          veiculo: titulo,
          dataInicio: dataCompleta,
          horaInicio: horario,
          dataFim: dataCompleta,
          horaFim,
          status: 'agendado',
        });
      }
    }

    try {
      window.dispatchEvent(new Event('agendamento:novo'));
      localStorage.setItem('agendamento:novo', new Date().getTime().toString());
    } catch (error) {
      console.error('Erro ao notificar agendamento:', error);
    }

    onSuccess();
    onClose();
  };

  const boxesCompativeis = todosBoxes.filter(
    (box) => !tipoPreferidoSelecionado || box.tipo === tipoPreferidoSelecionado
  );

  const boxOptions = (boxesDisponiveis.length > 0 ? boxesDisponiveis : boxesCompativeis).map((box) => ({
    value: box.id,
    label: `${box.nome} - ${box.parceiro}`,
  }));

  return (
    <Modal open={isOpen} onClose={onClose} title={agendamento ? 'Editar Agendamento' : 'Novo Agendamento'} className="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Título"
            value={titulo}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitulo(e.target.value)}
            required
            placeholder="Ex: 15 BYD - DOLPHIN"
          />

          <Input
            label="Placa"
            value={placa}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlaca(e.target.value)}
            required
            placeholder="ABC-1234"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Cliente"
            value={cliente}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCliente(e.target.value)}
            required
          />

          <Input
            label="Telefone"
            value={telefone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTelefone(e.target.value)}
            required
            placeholder="(11) 98765-4321"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Select
            label="Responsável"
            value={responsavel}
            onChange={(value) => setResponsavel(value)}
            options={equipes.map((e) => ({ 
              value: e.id, 
              label: e.nome ? `${e.nome} (${e.login})` : e.login
            }))}
            required
          />

          <Select
            label="Origem do Pedido"
            value={tag}
            onChange={(value) => setTag(value as 'INTERNO' | 'EXTERNO')}
            options={[
              { value: 'INTERNO', label: 'Interno (da Loja)' },
              { value: 'EXTERNO', label: 'Externo (Fora da Loja)' },
            ]}
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Select
            label="Tipo de OS"
            value={tipoOsId}
            onChange={(value) => {
              setTipoOsId(value);
              setItemId('');
              setTipo('');
              setDuracaoEstimada(60);
            }}
            options={tiposOsList.map((t) => ({ value: t.id, label: t.nome }))}
            required
          />

          {itensDisponiveis.length > 0 && (
            <Select
              label="Item"
              value={itemId}
              onChange={(value) => setItemId(value)}
              options={itensDisponiveis.map((i) => ({
                value: i.id,
                label: `${i.nome} (${i.tipo === 'servico' ? 'Serviço' : 'Produto'})`,
              }))}
              required
            />
          )}
        </div>

        <Select
          label="Box"
          value={boxId}
          onChange={(value) => setBoxId(value)}
          options={boxOptions}
          required
        />
        {dataIso && horario && duracaoEstimada && (
          <p className="text-xs text-slate-700 dark:text-slate-400 -mt-2">
            {boxesDisponiveis.length > 0
              ? `${boxesDisponiveis.length} box(es) disponível(is)`
              : 'Nenhum box disponível neste horário'}
          </p>
        )}

        <div className="grid md:grid-cols-3 gap-4">
          <Input
            label="Data"
            type="date"
            value={dataIso}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDataIso(e.target.value)}
            min={getBrasiliaTodayISO()}
            required
          />

          <Select
            label="Horário"
            value={horario}
            onChange={(value) => setHorario(value)}
            required
            options={horarioOptionsDisponiveis}
          />

          <Input
            label="Duração Estimada (minutos)"
            type="number"
            value={duracaoEstimada.toString()}
            onChange={() => undefined}
            required
            min={15}
            step={15}
            disabled
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Select
            label="Meio de Pagamento"
            value={meioPagamento}
            onChange={(value) => setMeioPagamento(value)}
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
            forceAbove
          />

          <Select
            label="Forma de Pagamento"
            value={formaPagamento}
            onChange={(value) => setFormaPagamento(value)}
            options={[
              { value: 'A_VISTA', label: 'A VISTA' },
              { value: '2_VEZES', label: '2 VEZES' },
              { value: '3_VEZES', label: '3 VEZES' },
              { value: '4_VEZES', label: '4 VEZES' },
              { value: '5_VEZES', label: '5 VEZES' },
              { value: '6_VEZES', label: '6 VEZES' },
            ]}
            forceAbove
          />
        </div>

        {erroValidacao && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-700 dark:text-red-300">{erroValidacao}</p>
          </div>
        )}

        {boxesDisponiveis.length === 0 && dataIso && horario && duracaoEstimada && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              ⚠️ Nenhum box disponível para o período selecionado.
            </p>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={Boolean(erroValidacao)}>
            {agendamento ? 'Salvar' : 'Criar Agendamento'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
