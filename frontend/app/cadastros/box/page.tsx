'use client';

import { useState, useEffect } from "react";
import { 
  Box, 
  TipoBox,
  getBoxes, 
  addBox, 
  updateBox, 
  deleteBox,
  getOcupacoesBoxPorData,
  initializeMockBoxes,
  OcupacaoBox
} from "@/services/boxService";
import { readArray } from "@/lib/storage";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { BoxTimeline, TimelineHeader, TimelineLegend } from "@/components/box/BoxTimeline";
import { getBrasiliaTodayISO, toDdMmYyyyFromISODate } from "@/lib/dateUtils";
import { Plus, Pencil, Trash2, Calendar, Clock } from "lucide-react";

type Parceiro = {
  id: string;
  nome: string;
  status: string;
};

const tipoBoxOptions = [
  { value: "lavagem", label: "Lavagem e Serviços Relacionados" },
  { value: "servico_geral", label: "Serviços Gerais" }
];

const coresDisponiveis = [
  { value: "#3b82f6", label: "Azul", class: "bg-blue-500" },
  { value: "#06b6d4", label: "Ciano", class: "bg-cyan-500" },
  { value: "#8b5cf6", label: "Violeta", class: "bg-violet-500" },
  { value: "#ec4899", label: "Rosa", class: "bg-pink-500" },
  { value: "#f59e0b", label: "Âmbar", class: "bg-amber-500" },
  { value: "#10b981", label: "Verde", class: "bg-emerald-500" },
  { value: "#ef4444", label: "Vermelho", class: "bg-red-500" },
  { value: "#6366f1", label: "Índigo", class: "bg-indigo-500" }
];

export default function BoxPage() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOcupacoesModalOpen, setIsOcupacoesModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [selectedBoxOcupacoes, setSelectedBoxOcupacoes] = useState<{ box: Box; ocupacoes: OcupacaoBox[] } | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState("");
  const [modoVisualizacao, setModoVisualizacao] = useState<"timeline" | "lista">("timeline");
  
  // Form states
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoBox>("lavagem");
  const [parceiroId, setParceiroId] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [cor, setCor] = useState("#3b82f6");

  useEffect(() => {
    initializeMockBoxes();
    carregarDados();
    
    // Inicializar com data de hoje
    const dataHoje = toDdMmYyyyFromISODate(getBrasiliaTodayISO());
    setDataSelecionada(dataHoje);
  }, []);

  const carregarDados = () => {
    const boxesData = getBoxes();
    setBoxes(boxesData);
    
    const parceirosData = readArray<Parceiro>("parceiros");
    setParceiros(parceirosData.filter(p => p.status === "ativo"));
  };

  const abrirModal = () => {
    limparForm();
    setEditandoId(null);
    setIsModalOpen(true);
  };

  const abrirModalEdicao = (box: Box) => {
    setNome(box.nome);
    setTipo(box.tipo);
    setParceiroId(box.parceiroId);
    setAtivo(box.ativo);
    setCor(box.cor || "#3b82f6");
    setEditandoId(box.id);
    setIsModalOpen(true);
  };

  const limparForm = () => {
    setNome("");
    setTipo("lavagem");
    setParceiroId("");
    setAtivo(true);
    setCor("#3b82f6");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parceiroSelecionado = parceiros.find(p => p.id === parceiroId);
    if (!parceiroSelecionado) {
      alert("Selecione um parceiro válido");
      return;
    }

    if (editandoId) {
      // Edição
      updateBox(editandoId, {
        nome,
        tipo,
        parceiroId,
        parceiro: parceiroSelecionado.nome,
        ativo,
        cor
      });
    } else {
      // Novo
      addBox({
        nome,
        tipo,
        parceiroId,
        parceiro: parceiroSelecionado.nome,
        ativo,
        cor
      });
    }

    carregarDados();
    setIsModalOpen(false);
    limparForm();
  };

  const handleDelete = (id: string) => {
    if (confirm("Deseja realmente excluir este box?")) {
      deleteBox(id);
      carregarDados();
    }
  };

  const verOcupacoes = (box: Box) => {
    const dataHoje = toDdMmYyyyFromISODate(getBrasiliaTodayISO());
    const ocupacoes = getOcupacoesBoxPorData(box.id, dataHoje);
    
    setSelectedBoxOcupacoes({ box, ocupacoes });
    setIsOcupacoesModalOpen(true);
  };

  const parceiroOptions = parceiros.map(p => ({
    value: p.id,
    label: p.nome
  }));

  // Agrupar boxes por parceiro
  const boxesPorParceiro = boxes.reduce((acc, box) => {
    if (!box.ativo) return acc;
    
    const parceiro = box.parceiro || "Sem Parceiro";
    if (!acc[parceiro]) {
      acc[parceiro] = [];
    }
    acc[parceiro].push(box);
    return acc;
  }, {} as Record<string, Box[]>);

  // Obter ocupações para a data selecionada
  const getOcupacoesParaData = (boxId: string) => {
    return getOcupacoesBoxPorData(boxId, dataSelecionada);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Gerenciamento de Boxes
          </h1>
          <p className="text-xs text-slate-700 dark:text-slate-400">
            Gerencie os boxes de trabalho e visualize ocupações
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setModoVisualizacao("timeline")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                modoVisualizacao === "timeline"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Clock className="h-3 w-3 inline mr-1" />
              Timeline
            </button>
            <button
              onClick={() => setModoVisualizacao("lista")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                modoVisualizacao === "lista"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              Lista
            </button>
          </div>
          <Button onClick={abrirModal}>
            <Plus className="h-4 w-4 mr-1" />
            Novo Box
          </Button>
        </div>
      </header>

      {/* Seletor de Data para Timeline */}
      {modoVisualizacao === "timeline" && (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Data:
            </label>
            <input
              type="date"
              value={dataSelecionada.split('/').reverse().join('-')}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const [ano, mes, dia] = e.target.value.split('-');
                setDataSelecionada(`${dia}/${mes}/${ano}`);
              }}
              className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
            <span className="text-xs text-slate-700 dark:text-slate-400">
              Visualizando ocupações para {dataSelecionada}
            </span>
          </div>
        </div>
      )}

      {/* Visualização Timeline */}
      {modoVisualizacao === "timeline" && (
        <div className="space-y-6">
          {Object.entries(boxesPorParceiro).map(([parceiro, boxesDoParceiro]) => (
            <div key={parceiro} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">📍</span>
                {parceiro}
                <span className="text-xs font-normal text-slate-700 dark:text-slate-400">
                  ({boxesDoParceiro.length} {boxesDoParceiro.length === 1 ? "box" : "boxes"})
                </span>
              </h2>
              
              <div className="space-y-2">
                <div className="overflow-x-scroll touch-pan-x pb-4 scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-500 scrollbar-track-slate-200 dark:scrollbar-track-slate-700" style={{ scrollbarWidth: 'thin' }}>
                  <TimelineHeader />
                </div>
                {boxesDoParceiro.map(box => (
                  <div key={box.id} className="relative group">
                    <BoxTimeline
                      box={box}
                      ocupacoes={getOcupacoesParaData(box.id)}
                      data={dataSelecionada}
                    />
                    {/* Botões de ação no hover */}
                    <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={() => abrirModalEdicao(box)}
                        className="p-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                        title="Editar"
                      >
                        <Pencil className="h-3 w-3 text-slate-700 dark:text-slate-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(box.id)}
                        className="p-1 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 rounded"
                        title="Excluir"
                      >
                        <Trash2 className="h-3 w-3 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
                <TimelineLegend />
              </div>
            </div>
          ))}

          {Object.keys(boxesPorParceiro).length === 0 && (
            <div className="text-center py-12 text-slate-700 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
              Nenhum box cadastrado. Clique em "Novo Box" para começar.
            </div>
          )}
        </div>
      )}

      {/* Visualização em Lista (mantém a original) */}
      {modoVisualizacao === "lista" && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Boxes de Lavagem */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              Lavagem e Serviços Relacionados ({boxes.filter(b => b.tipo === "lavagem").length})
            </h2>
            <div className="space-y-2">
              {boxes.filter(b => b.tipo === "lavagem").map(box => (
                <BoxCard 
                  key={box.id}
                  box={box}
                  onEdit={abrirModalEdicao}
                  onDelete={handleDelete}
                  onVerOcupacoes={verOcupacoes}
                />
              ))}
              {boxes.filter(b => b.tipo === "lavagem").length === 0 && (
                <div className="text-center py-8 text-sm text-slate-700 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                  Nenhum box de lavagem cadastrado
                </div>
              )}
            </div>
          </div>

          {/* Boxes de Serviço Geral */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-violet-500"></div>
              Serviços Gerais ({boxes.filter(b => b.tipo === "servico_geral").length})
            </h2>
            <div className="space-y-2">
              {boxes.filter(b => b.tipo === "servico_geral").map(box => (
                <BoxCard 
                  key={box.id}
                  box={box}
                  onEdit={abrirModalEdicao}
                  onDelete={handleDelete}
                  onVerOcupacoes={verOcupacoes}
                />
              ))}
              {boxes.filter(b => b.tipo === "servico_geral").length === 0 && (
                <div className="text-center py-8 text-sm text-slate-700 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                  Nenhum box de serviço geral cadastrado
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editandoId ? "Editar Box" : "Novo Box"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome do Box"
            value={nome}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNome(e.target.value)}
            required
            placeholder="Ex: Box 1 - Lavagem"
          />
          
          <Select
            label="Tipo de Serviço"
            value={tipo}
            onChange={(value) => setTipo(value as TipoBox)}
            options={tipoBoxOptions}
            required
          />

          <Select
            label="Parceiro Responsável"
            value={parceiroId}
            onChange={(value) => setParceiroId(value)}
            options={parceiroOptions}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Cor de Identificação
            </label>
            <div className="grid grid-cols-4 gap-2">
              {coresDisponiveis.map(corOpcao => (
                <button
                  key={corOpcao.value}
                  type="button"
                  onClick={() => setCor(corOpcao.value)}
                  className={`h-10 rounded-lg border-2 ${corOpcao.class} ${
                    cor === corOpcao.value 
                      ? 'border-slate-900 dark:border-slate-100 scale-110' 
                      : 'border-slate-300 dark:border-slate-600'
                  } transition-all`}
                  title={corOpcao.label}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ativo"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="ativo" className="text-sm text-slate-700 dark:text-slate-300">
              Box ativo
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editandoId ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Ocupações */}
      <Modal
        open={isOcupacoesModalOpen}
        onClose={() => setIsOcupacoesModalOpen(false)}
        title={selectedBoxOcupacoes ? `Ocupações - ${selectedBoxOcupacoes.box.nome}` : "Ocupações"}
        className="max-w-3xl"
      >
        {selectedBoxOcupacoes && (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
              <p className="text-sm text-slate-700 dark:text-slate-400">
                Exibindo ocupações de hoje
              </p>
            </div>

            {selectedBoxOcupacoes.ocupacoes.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-700 dark:text-slate-400">
                Nenhuma ocupação para hoje
              </div>
            ) : (
              <div className="space-y-2">
                {selectedBoxOcupacoes.ocupacoes.map(ocupacao => (
                  <div 
                    key={ocupacao.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-slate-700 dark:text-slate-400">
                          {ocupacao.veiculo}
                        </p>
                        <p className="text-xs text-slate-700 dark:text-slate-400">
                          Cliente: {ocupacao.cliente}
                        </p>
                        <p className="text-xs text-slate-700 dark:text-slate-400">
                          {ocupacao.horaInicio} - {ocupacao.horaFim}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        ocupacao.status === "agendado" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                        ocupacao.status === "em_uso" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                        ocupacao.status === "finalizado" ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" :
                        "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      }`}>
                        {ocupacao.status === "agendado" ? "Agendado" :
                         ocupacao.status === "em_uso" ? "Em Uso" :
                         ocupacao.status === "finalizado" ? "Finalizado" :
                         "Cancelado"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// Componente de Card do Box
function BoxCard({ 
  box, 
  onEdit, 
  onDelete,
  onVerOcupacoes
}: { 
  box: Box; 
  onEdit: (box: Box) => void; 
  onDelete: (id: string) => void;
  onVerOcupacoes: (box: Box) => void;
}) {
  return (
    <div 
      className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:shadow-md transition-shadow"
      style={{ borderLeftWidth: '4px', borderLeftColor: box.cor }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm text-slate-900 dark:text-slate-100">
              {box.nome}
            </h3>
            {!box.ativo && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-400">
                Inativo
              </span>
            )}
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-400 mt-1">
            Parceiro: {box.parceiro}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => onVerOcupacoes(box)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            title="Ver ocupações"
          >
            <Calendar className="h-4 w-4 text-slate-700 dark:text-slate-400" />
          </button>
          <button
            onClick={() => onEdit(box)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            title="Editar"
          >
            <Pencil className="h-4 w-4 text-slate-700 dark:text-slate-400" />
          </button>
          <button
            onClick={() => onDelete(box.id)}
            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
            title="Excluir"
          >
            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
