'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/AuthContext';
import { getBoxes, getBoxesDisponiveis, getTipoBoxPreferidoPorServico, addOcupacao } from '@/services/boxService';
import { ClienteCompleto } from '@/services/clienteService';
import { addAgendamento, getAgendamentos } from '@/services/agendaService';
import { readArray } from '@/lib/storage';
import { mockFabricantes, getModelosPorFabricante } from '@/lib/mockFormData';
import { getBrasiliaYear, getBrasiliaTodayISO, getBrasiliaNow, getBusinessTimeOptions, isPastBrasiliaISODate, isSundayISODate, isWithinBusinessHours, timeToMinutes, toDdMmFromISODate, toDdMmYyyyFromISODate } from '@/lib/dateUtils';

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
  itens: TipoOSItem[];
  [key: string]: unknown;
};

type Equipe = {
  id: string;
  nome: string;
  login: string;
  [key: string]: unknown;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cliente: ClienteCompleto | null;
};

type AgendarTraceEntry = {
  t: number;
  step: string;
  details?: Record<string, unknown>;
};

function traceAgendar(step: string, details?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;

  try {
    const entry: AgendarTraceEntry = {
      t: Date.now(),
      step,
      details,
    };

    const currentWindow = window as Window & { __AGENDAR_TRACE__?: AgendarTraceEntry[] };
    const queue = currentWindow.__AGENDAR_TRACE__ || [];
    queue.push(entry);
    if (queue.length > 120) {
      queue.splice(0, queue.length - 120);
    }
    currentWindow.__AGENDAR_TRACE__ = queue;

    localStorage.setItem('debug:agendar:last', JSON.stringify(entry));
  } catch {
    // noop
  }
}

export default function AgendaQuickModal({ isOpen, onClose, onSuccess, cliente }: Props) {
  const { user } = useAuth();
  const [tipoOs, setTipoOs] = useState('');
  const [item, setItem] = useState('');
  const [dataIso, setDataIso] = useState('');
  const [horario, setHorario] = useState('');
  const [duracao, setDuracao] = useState(60);
  const [responsavel, setResponsavel] = useState('');
  const [boxId, setBoxId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [erroValidacao, setErroValidacao] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [meioPagamento, setMeioPagamento] = useState('');
  const [origemPedido, setOrigemPedido] = useState<'INTERNO' | 'EXTERNO'>('EXTERNO');
  
  // Estados para dados carregados
  const [tiposOsList, setTiposOsList] = useState<TipoOS[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [boxes, setBoxes] = useState<Array<{id: string; nome: string; ativo: boolean; parceiro: string; tipo: 'lavagem' | 'servico_geral'}>>([]);

  // Carregar dados apenas quando modal abre
  useEffect(() => {
    if (isOpen) {
      traceAgendar('quick-modal:open', { clienteId: cliente?.id || null });
      setIsLoading(true);
      setDataIso((prev) => prev || getBrasiliaTodayISO());

      const timer = window.setTimeout(() => {
        try {
          const tiposStart = performance.now();
          const tipos = readArray<TipoOS>('tiposOs');
          setTiposOsList(tipos);
          const tiposMs = Math.round(performance.now() - tiposStart);
          traceAgendar('quick-modal:tipos-loaded', { count: tipos.length, ms: tiposMs });

          const equipesData = readArray<Equipe>('equipes');
          setEquipes(equipesData);
          
          // Definir responsável padrão como usuário logado
          if (user && equipesData.length > 0) {
            const userEquipe = equipesData.find(e => e.nome === user.name || e.login === user.email);
            if (userEquipe) {
              setResponsavel(userEquipe.id);
            }
          }

          const boxesStart = performance.now();
          const boxesData = getBoxes().filter(b => b.ativo);
          setBoxes(boxesData);
          const boxesMs = Math.round(performance.now() - boxesStart);
          traceAgendar('quick-modal:boxes-loaded', { count: boxesData.length, ms: boxesMs });
        } catch (e) {
          traceAgendar('quick-modal:load-error', {
            message: e instanceof Error ? e.message : 'erro desconhecido',
          });
          console.error('Erro ao carregar dados do agendamento rápido:', e);
        } finally {
          setIsLoading(false);
          traceAgendar('quick-modal:ready');
        }
      }, 0);

      return () => {
        window.clearTimeout(timer);
      };
    } else {
      setTiposOsList([]);
      setEquipes([]);
      setBoxes([]);
      setIsLoading(false);
      traceAgendar('quick-modal:closed');
    }
  }, [isOpen, cliente?.id, user]);

  if (!isOpen || !cliente) return null;

  const tipoSelecionadoAtual = tiposOsList.find(t => t.id === tipoOs);
  const itensDisponiveis = tipoSelecionadoAtual?.itens || [];

  const isConflitoHorario = (inicioA: number, fimA: number, inicioB: number, fimB: number): boolean => {
    return inicioA < fimB && fimA > inicioB;
  };

  const tipoServicoSelecionado =
    tipoSelecionadoAtual?.itens.find(i => i.id === item)?.nome ||
    tipoSelecionadoAtual?.nome ||
    '';

  const calcularHoraFim = (horaInicio: string, duracaoMinutos: number): string => {
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const dataInicio = new Date(2000, 0, 1, horas, minutos);
    const dataFim = new Date(dataInicio.getTime() + duracaoMinutos * 60000);
    return `${String(dataFim.getHours()).padStart(2, '0')}:${String(dataFim.getMinutes()).padStart(2, '0')}`;
  };

  const tipoPreferidoSelecionado = getTipoBoxPreferidoPorServico(tipoServicoSelecionado);
  const horarioOptions = getBusinessTimeOptions(duracao);
  const boxesCompativeis = boxes.filter(
    (box) => !tipoPreferidoSelecionado || box.tipo === tipoPreferidoSelecionado
  );

  const boxesDisponiveisSelecionados =
    dataIso && horario && tipoOs
      ? getBoxesDisponiveis(
          toDdMmYyyyFromISODate(dataIso),
          horario,
          toDdMmYyyyFromISODate(dataIso),
          calcularHoraFim(horario, duracao),
          tipoPreferidoSelecionado
        )
      : boxesCompativeis;

  const boxOptions = boxesDisponiveisSelecionados.map((b) => ({
    value: b.id,
    label: `${b.nome} - ${b.parceiro}`,
  }));

  const horarioOptionsDisponiveis = horarioOptions.filter((option) => {
    if (!dataIso || !tipoOs) return true;

    const dataCurta = toDdMmFromISODate(dataIso);
    const dataCompleta = toDdMmYyyyFromISODate(dataIso);
    const inicio = timeToMinutes(option.value);
    const fim = inicio + duracao;

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

    const capacidade = boxesCompativeis.length;
    if (capacidade === 0) return false;

    const agendamentosConflitantes = getAgendamentos().filter((agendamentoAtual) => {
      if (agendamentoAtual.data !== dataCurta) return false;
      const inicioAg = timeToMinutes(agendamentoAtual.horario);
      const fimAg = inicioAg + (agendamentoAtual.duracaoEstimada || 60);
      return isConflitoHorario(inicio, fim, inicioAg, fimAg);
    });

    if (agendamentosConflitantes.length >= capacidade) {
      return false;
    }

    const horaFim = calcularHoraFim(option.value, duracao);
    const boxesLivres = getBoxesDisponiveis(
      dataCompleta,
      option.value,
      dataCompleta,
      horaFim,
      tipoPreferidoSelecionado
    );

    return boxesLivres.length > 0;
  });

  useEffect(() => {
    const itemSelecionado = tipoSelecionadoAtual?.itens.find(i => i.id === item);
    if (itemSelecionado?.duracao) {
      // Limitar duração entre 45 min (mínimo) e 120 min (máximo)
      const duracaoLimitada = Math.max(45, Math.min(itemSelecionado.duracao, 120));
      setDuracao(duracaoLimitada);
      return;
    }
    if (!item) {
      setDuracao(60);
    }
  }, [tipoOs, item, tiposOsList]);

  useEffect(() => {
    if (!horario) return;
    if (!horarioOptionsDisponiveis.some((opt) => opt.value === horario)) {
      setHorario('');
    }
  }, [duracao, horario, dataIso, tipoOs, item, boxes]);

  const validarDisponibilidade = (): boolean => {
    if (!dataIso || !horario || !tipoOs) {
      setErroValidacao('');
      return false;
    }

    if (isPastBrasiliaISODate(dataIso)) {
      setErroValidacao('Não é permitido agendar em dias passados.');
      return false;
    }

    if (isSundayISODate(dataIso)) {
      setErroValidacao('Domingo é uma data inválida para agendamento.');
      return false;
    }

    if (!isWithinBusinessHours(horario, duracao)) {
      setErroValidacao('Horário inválido. Atendemos de 08:00 às 18:00 e fechamos para almoço de 12:00 às 13:30.');
      return false;
    }

    if (!horarioOptionsDisponiveis.some((opt) => opt.value === horario)) {
      setErroValidacao('Sem vagas neste horário considerando agenda e boxes disponíveis.');
      return false;
    }

    const tipoPreferido = tipoPreferidoSelecionado;

    const dataCompleta = toDdMmYyyyFromISODate(dataIso);
    const horaFim = calcularHoraFim(horario, duracao);
    const boxesLivres = getBoxesDisponiveis(
      dataCompleta,
      horario,
      dataCompleta,
      horaFim,
      tipoPreferido
    );

    if (boxesLivres.length === 0) {
      setErroValidacao('Não há vagas de box disponíveis para esta tarefa neste horário.');
      return false;
    }

    if (boxId && !boxesLivres.some(b => b.id === boxId)) {
      setErroValidacao('O box selecionado não está disponível para este horário/tarefa.');
      return false;
    }

    if (!boxId) {
      setErroValidacao('Selecione um box para concluir o agendamento.');
      return false;
    }

    setErroValidacao('');
    return true;
  };

  useEffect(() => {
    if (!isOpen) return;
    validarDisponibilidade();
  }, [isOpen, dataIso, horario, duracao, tipoOs, item, boxId, tiposOsList]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    traceAgendar('quick-modal:submit-start', {
      tipoOs,
      item,
      dataIso,
      horario,
      hasBox: Boolean(boxId),
    });

    if (!dataIso || !horario || !tipoOs) {
      traceAgendar('quick-modal:submit-invalid');
      return;
    }

    if (!validarDisponibilidade()) {
      traceAgendar('quick-modal:submit-blocked', { erro: erroValidacao || 'sem disponibilidade' });
      return;
    }

    const dataCurta = toDdMmFromISODate(dataIso);
    const dataCompleta = toDdMmYyyyFromISODate(dataIso);

    // Buscar dados para submit
    const tipoSelecionado = tiposOsList.find(t => t.id === tipoOs);
    const itemSelecionado = tipoSelecionado?.itens.find(i => i.id === item);
    const boxSelecionado = boxes.find(b => b.id === boxId);

    // Criar título do veículo
    const fabricanteObj = mockFabricantes.find(f => f.value === cliente.fabricante);
    const fabricanteNome = fabricanteObj?.label.toUpperCase() || 'VEÍCULO';
    
    let modeloNome = 'DESCONHECIDO';
    if (cliente.fabricante && cliente.modelo) {
      const modelos = getModelosPorFabricante(cliente.fabricante);
      const modeloObj = modelos?.find(m => m.value === cliente.modelo);
      modeloNome = modeloObj?.label.toUpperCase() || cliente.modelo.toUpperCase();
    }
    
    const ano = String(getBrasiliaYear()).slice(-2);
    const titulo = `${ano} ${fabricanteNome} - ${modeloNome}`;

    // Criar agendamento
    const novoAgendamento = addAgendamento({
      titulo,
      placa: cliente.placaChassi || cliente.placa || 'SEM-PLACA',
      responsavel: responsavel || 'Atendente',
      cliente: cliente.nomeCliente || 'Cliente',
      telefone: cliente.telefone || '',
      tipo: itemSelecionado?.nome || tipoSelecionado?.nome || 'Serviço',
      tag: origemPedido,
      data: dataCurta,
      horario,
      duracaoEstimada: duracao,
      boxId: boxId || undefined,
      boxNome: boxSelecionado?.nome || undefined,
      clienteId: cliente.id,
        formaPagamento: formaPagamento || undefined,
        meioPagamento: meioPagamento || undefined,
    });
    traceAgendar('quick-modal:agendamento-created', { id: novoAgendamento.id });

    // Criar ocupação de box se selecionado
    if (boxId && boxSelecionado) {
      const horaFim = calcularHoraFim(horario, duracao);
      
      addOcupacao({
        boxId,
        boxNome: boxSelecionado.nome,
        referencia: novoAgendamento.id,
        tipoReferencia: 'agendamento',
        cliente: cliente.nomeCliente || 'Cliente',
        veiculo: titulo,
        dataInicio: dataCompleta,
        horaInicio: horario,
        dataFim: dataCompleta,
        horaFim,
        status: 'agendado',
      });
      traceAgendar('quick-modal:ocupacao-created', { boxId });
    }

    // Notificar
    try {
      window.dispatchEvent(new Event('agendamento:novo'));
      localStorage.setItem('agendamento:novo', new Date().getTime().toString());
      traceAgendar('quick-modal:event-dispatched');
    } catch (e) {
      console.error('Erro ao notificar novo agendamento:', e);
      traceAgendar('quick-modal:event-error', {
        message: e instanceof Error ? e.message : 'erro desconhecido',
      });
    }

    // Limpar e fechar
    setTipoOs('');
    setItem('');
    setDataIso(getBrasiliaTodayISO());
    setHorario('');
    setDuracao(60);
    setBoxId('');
    traceAgendar('quick-modal:submit-success');
    
    onSuccess();
  };

  const handleClose = () => {
    traceAgendar('quick-modal:close-click');
    setTipoOs('');
    setItem('');
    setDataIso(getBrasiliaTodayISO());
    setHorario('');
    setDuracao(60);
    setBoxId('');
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose} title="Agendar Serviço" className="max-w-2xl" showFooter={false}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info do Cliente */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Cliente</h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Nome</p>
              <p className="text-slate-900 dark:text-slate-100 font-medium">{cliente.nomeCliente}</p>
            </div>
            <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Telefone</p>
              <p className="text-slate-900 dark:text-slate-100">{cliente.telefone}</p>
            </div>
          </div>
        </div>

        {/* Formul\u00e1rio */}
        <div className="space-y-3">
          {isLoading && (
            <p className="text-sm text-slate-600 dark:text-slate-300">Carregando dados do agendamento...</p>
          )}

          <Select
            label="Responsável"
            value={responsavel}
            onChange={setResponsavel}
            options={equipes.map(e => ({ 
              value: e.id, 
              label: e.nome ? `${e.nome} (${e.login})` : e.login
            }))}
            required
          />

          <Select
            label="Origem do Pedido"
            value={origemPedido}
            onChange={(value) => setOrigemPedido(value as 'INTERNO' | 'EXTERNO')}
            options={[
              { value: 'INTERNO', label: 'Interno (da Loja)' },
              { value: 'EXTERNO', label: 'Externo (Fora da Loja)' },
            ]}
            required
          />

          <Select
            label="Tipo de OS"
            value={tipoOs}
            onChange={(val) => { setTipoOs(val); setItem(''); }}
            options={tiposOsList.map(t => ({ value: t.id, label: t.nome }))}
            required
          />

          {itensDisponiveis.length > 0 && (
            <Select
              label="Item"
              value={item}
              onChange={setItem}
              options={itensDisponiveis.map(i => ({ 
                value: i.id, 
                label: `${i.nome} (${i.tipo === 'servico' ? 'Serviço' : 'Produto'})` 
              }))}
              required
            />
          )}

          <Select
            label="Box"
            value={boxId}
            onChange={setBoxId}
            options={boxOptions}
            required
          />

          <div className="grid md:grid-cols-3 gap-3">
            <Input
              label="Data"
              type="date"
              value={dataIso}
              onChange={(e) => setDataIso(e.target.value)}
              min={getBrasiliaTodayISO()}
              required
            />

            <Select
              label="Horário"
              value={horario}
              onChange={setHorario}
              options={horarioOptionsDisponiveis}
              required
            />
            
            <Input
              label="Duração (min)"
              type="number"
              value={duracao.toString()}
              onChange={() => undefined}
              min={15}
              step={15}
              disabled
              required
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Select
              label="Meio de Pagamento"
              value={meioPagamento}
              onChange={setMeioPagamento}
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
              onChange={setFormaPagamento}
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
            <p className="text-sm text-red-600 dark:text-red-400">{erroValidacao}</p>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={Boolean(erroValidacao) || isLoading}>
            Agendar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
