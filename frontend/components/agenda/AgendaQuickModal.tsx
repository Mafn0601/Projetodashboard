'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/AuthContext';
import { getBoxes, getBoxesDisponiveis, getTipoBoxPreferidoPorServico, addOcupacao, convertBoxAPIToService, getBoxesDisponivelsDaeArray, Box } from '@/services/boxService';
import boxServiceAPI, { BoxAPI } from '@/services/boxServiceAPI';
import { ClienteCompleto } from '@/services/clienteService';
import { parceiroServiceAPI, ParceiroAPI } from '@/services/parceiroServiceAPI';
import { equipeServiceAPI, EquipeAPI } from '@/services/equipeServiceAPI';
import { addAgendamento, getAgendamentos } from '@/services/agendaService';
import { agendamentoServiceAPI } from '@/services/agendamentoServiceAPI';
import { readArray } from '@/lib/storage';
import { mockFabricantes, getModelosPorFabricante } from '@/lib/mockFormData';
import { buildBrasiliaDateTimeISOString, getBrasiliaYear, getBrasiliaTodayISO, getBrasiliaNow, getBusinessTimeOptions, isPastBrasiliaISODate, isSundayISODate, isWithinBusinessHours, timeToMinutes, toDdMmFromISODate, toDdMmYyyyFromISODate } from '@/lib/dateUtils';

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
  parceiroId?: string;
  ativo?: boolean;
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
  const [tiposItens, setTiposItens] = useState<Array<{tipoId: string; tipoNome: string; itemId: string; itemNome: string; preco: number}>>([]);
  const [tipoTemporario, setTipoTemporario] = useState('');
  const [itemTemporario, setItemTemporario] = useState('');
  const [dataIso, setDataIso] = useState('');
  const [horario, setHorario] = useState('');
  const [duracao, setDuracao] = useState(60);
  const [parceiroId, setParceiroId] = useState('');
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
  const [parceiros, setParceiros] = useState<ParceiroAPI[]>([]);
  const [boxes, setBoxes] = useState<BoxAPI[]>([]);
  const [boxesConvertidos, setBoxesConvertidos] = useState<Box[]>([]);

  // Carregar dados apenas quando modal abre
  useEffect(() => {
    if (isOpen) {
      traceAgendar('quick-modal:open', { clienteId: cliente?.id || null });
      setIsLoading(true);
      setDataIso((prev) => prev || getBrasiliaTodayISO());

      const timer = window.setTimeout(() => {
        try {
          Promise.all([
            parceiroServiceAPI.findAll({ preferCache: true }),
            equipeServiceAPI.findAll(undefined, undefined, { preferCache: true }),
            boxServiceAPI.findAll({ ativo: true }, { preferCache: true }),
          ]).then(([parceirosApi, equipesApi, boxesApi]) => {
            const equipesAtivas = (equipesApi || []).filter((eq: EquipeAPI) => eq.ativo !== false);
            setParceiros(parceirosApi || []);
            setEquipes(
              equipesAtivas.map((eq: EquipeAPI) => ({
                id: eq.id,
                nome: eq.nome || eq.login,
                login: eq.login,
                parceiroId: eq.parceiroId,
                ativo: eq.ativo,
              }))
            );
            setBoxes(boxesApi || []);
            const boxesMs = Math.round(performance.now());
            traceAgendar('quick-modal:boxes-loaded', { count: (boxesApi || []).length, ms: boxesMs });
          }).catch((e) => {
            console.error('Erro ao carregar parceiros/equipes/boxes da API no agendamento rápido:', e);
            setParceiros([]);
            setEquipes([]);
            setBoxes([]);
          });

          const tiposStart = performance.now();
          const tipos = readArray<TipoOS>('tiposOs');
          setTiposOsList(tipos);
          const tiposMs = Math.round(performance.now() - tiposStart);
          traceAgendar('quick-modal:tipos-loaded', { count: tipos.length, ms: tiposMs });
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
      setParceiros([]);
      setEquipes([]);
      setBoxes([]);
      setIsLoading(false);
      traceAgendar('quick-modal:closed');
    }
  }, [isOpen, cliente?.id, user]);

  // Converter boxes da API para o formato esperado pelo boxService
  useEffect(() => {
    if (boxes.length > 0) {
      const converted = convertBoxAPIToService(boxes);
      setBoxesConvertidos(converted);
    } else {
      setBoxesConvertidos([]);
    }
  }, [boxes]);

  const responsavelOptionsFiltrados = equipes
    .filter((equipeAtual) => !parceiroId || equipeAtual.parceiroId === parceiroId)
    .map((equipeAtual) => ({
      value: equipeAtual.id,
      label: equipeAtual.nome ? `${equipeAtual.nome} (${equipeAtual.login})` : equipeAtual.login,
    }));

  useEffect(() => {
    if (!responsavel) return;
    if (!responsavelOptionsFiltrados.some((option) => option.value === responsavel)) {
      setResponsavel('');
    }
  }, [parceiroId, responsavel, responsavelOptionsFiltrados]);

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
  const boxesCompativeis = boxesConvertidos.filter(
    (box) => !tipoPreferidoSelecionado || box.tipo === tipoPreferidoSelecionado
  );

  const boxesDisponiveisSelecionados =
    dataIso && horario && tipoOs
      ? getBoxesDisponivelsDaeArray(
          boxesCompativeis,
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

  const handleAdicionarItem = () => {
    if (!tipoTemporario || !itemTemporario) {
      alert('Selecione um tipo e um item');
      return;
    }

    const tipoSelecionado = tiposOsList.find(t => t.id === tipoTemporario);
    const itemSelecionado = tipoSelecionado?.itens.find(i => i.id === itemTemporario);

    if (!tipoSelecionado || !itemSelecionado) {
      alert('Tipo ou item não encontrado');
      return;
    }

    // Verificar se o item já foi adicionado
    const jaAdicionado = tiposItens.some(
      ti => ti.tipoId === tipoTemporario && ti.itemId === itemTemporario
    );

    if (jaAdicionado) {
      alert('Este item já foi adicionado');
      return;
    }

    setTiposItens([...tiposItens, {
      tipoId: tipoTemporario,
      tipoNome: tipoSelecionado.nome,
      itemId: itemTemporario,
      itemNome: itemSelecionado.nome,
      preco: itemSelecionado.preco
    }]);

    setTipoTemporario('');
    setItemTemporario('');
  };

  const handleRemoverItem = (index: number) => {
    setTiposItens(tiposItens.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    traceAgendar('quick-modal:submit-start', {
      tiposItens: tiposItens.length,
      dataIso,
      horario,
      hasBox: Boolean(boxId),
    });

    if (!dataIso || !horario || tiposItens.length === 0 || !parceiroId || !responsavel) {
      traceAgendar('quick-modal:submit-invalid');
      setErroValidacao('Preencha todos os campos obrigatórios (parceiro, responsável e pelo menos um tipo/item)');
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

    try {
      // Salvar agendamentos na API para cada tipo/item selecionado
      const dataAgendamentoISO = buildBrasiliaDateTimeISOString(dataIso, `${horario}:00`);
      
      let sucessoAgendamentos = 0;
      for (const tipoItem of tiposItens) {
        const novoAgendamentoAPI = await agendamentoServiceAPI.create({
          clienteId: cliente.id,
          parceiroId: parceiroId || undefined,
          responsavelId: responsavel,
          dataAgendamento: dataAgendamentoISO,
          horarioAgendamento: horario,
          tipoAgendamento: `${tipoItem.tipoNome} - ${tipoItem.itemNome}`,
          descricaoServico: `${titulo} - ${cliente.placaChassi || cliente.placa || 'SEM PLACA'}`,
        });

        if (novoAgendamentoAPI) {
          sucessoAgendamentos++;
          traceAgendar('quick-modal:api-success', { id: novoAgendamentoAPI.id });
        } else {
          console.warn('⚠️ Agendamento não foi criado:', tipoItem.tipoNome);
          traceAgendar('quick-modal:api-failed', { tipoItem: tipoItem.tipoNome });
        }
      }

      // Se nenhum agendamento foi criado na API, lançar erro
      if (sucessoAgendamentos === 0) {
        throw new Error('Nenhum agendamento foi criado. Por favor, verifique os dados e tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao salvar agendamento na API:', error);
      traceAgendar('quick-modal:api-error', {
        message: error instanceof Error ? error.message : 'erro desconhecido',
      });
      setErroValidacao(error instanceof Error ? error.message : 'Erro ao criar agendamento');
      return;
    }

    const responsavelNome =
      responsavelOptionsFiltrados.find((opt) => opt.value === responsavel)?.label ||
      equipes.find((equipeAtual) => equipeAtual.id === responsavel)?.nome ||
      equipes.find((equipeAtual) => equipeAtual.id === responsavel)?.login ||
      'Atendente';

    // Também salvar no localStorage para compatibilidade (para cada item)
    for (const tipoItem of tiposItens) {
      const novoAgendamento = addAgendamento({
        titulo,
        placa: cliente.placaChassi || cliente.placa || 'SEM-PLACA',
        responsavel: responsavelNome,
        cliente: cliente.nome || cliente.nomeCliente || 'Cliente',
        telefone: cliente.telefone || '',
        tipo: `${tipoItem.tipoNome} - ${tipoItem.itemNome}`,
        tag: origemPedido,
        data: dataCurta,
        horario,
        duracaoEstimada: duracao,
        boxId: boxId || undefined,
        boxNome: boxId ? boxes.find(b => b.id === boxId)?.nome : undefined,
        clienteId: cliente.id,
        formaPagamento: formaPagamento || undefined,
        meioPagamento: meioPagamento || undefined,
      });
      traceAgendar('quick-modal:agendamento-created', { id: novoAgendamento.id });

      // Criar ocupação de box se selecionado
      if (boxId) {
        const boxSelecionado = boxes.find(b => b.id === boxId);
        if (boxSelecionado) {
          const horaFim = calcularHoraFim(horario, duracao);
          
          addOcupacao({
            boxId,
            boxNome: boxSelecionado.nome,
            referencia: novoAgendamento.id,
            tipoReferencia: 'agendamento',
            cliente: cliente.nome || cliente.nomeCliente || 'Cliente',
            veiculo: titulo,
            dataInicio: dataCompleta,
            horaInicio: horario,
            dataFim: dataCompleta,
            horaFim,
            status: 'agendado',
          });
          traceAgendar('quick-modal:ocupacao-created', { boxId });
        }
      }
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
    setTiposItens([]);
    setTipoTemporario('');
    setItemTemporario('');
    setDataIso(getBrasiliaTodayISO());
    setHorario('');
    setDuracao(60);
    setParceiroId('');
    setResponsavel('');
    setBoxId('');
    traceAgendar('quick-modal:submit-success');
    
    onSuccess();
  };

  const handleClose = () => {
    traceAgendar('quick-modal:close-click');
    setTipoOs('');
    setItem('');
    setTiposItens([]);
    setTipoTemporario('');
    setItemTemporario('');
    setDataIso(getBrasiliaTodayISO());
    setHorario('');
    setDuracao(60);
    setParceiroId('');
    setResponsavel('');
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
              <p className="text-slate-900 dark:text-slate-100 font-medium">{cliente?.nome || cliente?.nomeCliente || '-'}</p>
            </div>
            <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Telefone</p>
              <p className="text-slate-900 dark:text-slate-100">{cliente?.telefone || '-'}</p>
            </div>
          </div>
        </div>

        {/* Formul\u00e1rio */}
        <div className="space-y-3">
          {isLoading && (
            <p className="text-sm text-slate-600 dark:text-slate-300">Carregando dados do agendamento...</p>
          )}

          <Select
            label="Parceiro"
            value={parceiroId}
            onChange={setParceiroId}
            options={parceiros.map((parceiroAtual) => ({ value: parceiroAtual.id, label: parceiroAtual.nome }))}
            required
          />

          <Select
            label="Responsável"
            value={responsavel}
            onChange={setResponsavel}
            options={responsavelOptionsFiltrados}
            required
            disabled={!parceiroId}
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
            value={tipoTemporario}
            onChange={(val) => { setTipoTemporario(val); setItemTemporario(''); }}
            options={tiposOsList.map(t => ({ value: t.id, label: t.nome }))}
          />

          {tipoTemporario && (
            <Select
              label="Item"
              value={itemTemporario}
              onChange={setItemTemporario}
              options={tiposOsList
                .find(t => t.id === tipoTemporario)
                ?.itens.map(i => ({ 
                  value: i.id, 
                  label: `${i.nome} - R$ ${i.preco.toFixed(2)} (${i.tipo === 'servico' ? 'Serviço' : 'Produto'})` 
                })) || []}
            />
          )}

          {tipoTemporario && itemTemporario && (
            <button
              type="button"
              onClick={handleAdicionarItem}
              className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors text-sm font-semibold"
            >
              ➕ Adicionar Tipo/Item
            </button>
          )}

          {/* Lista de Tipos/Itens Selecionados */}
          {tiposItens.length > 0 && (
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Tipos/Itens Selecionados</h4>
              <div className="space-y-2">
                {tiposItens.map((tipoItem, index) => (
                  <div key={index} className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {tipoItem.tipoNome} - {tipoItem.itemNome}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Preço: <span className="font-semibold text-green-600 dark:text-green-400">R$ {tipoItem.preco.toFixed(2)}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoverItem(index)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                    >
                      ✕ Remover
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Total de Itens: <span className="text-blue-600 dark:text-blue-400">{tiposItens.length}</span>
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Soma dos Preços: <span className="text-green-600 dark:text-green-400">R$ {tiposItens.reduce((sum, item) => sum + item.preco, 0).toFixed(2)}</span>
                </p>
              </div>
            </div>
          )}

          {tiposItens.length === 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ Selecione pelo menos um tipo/item para continuar
              </p>
            </div>
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
