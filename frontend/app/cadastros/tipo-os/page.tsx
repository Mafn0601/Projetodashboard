'use client';

import { useState, useEffect, Fragment } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MaskedInput, currencyToNumber, numberToCurrency } from '@/components/ui/MaskedInput';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { readArray, writeArray } from '@/lib/storage';

type ServicoProduto = {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  desconto: number;
  tipo: 'servico' | 'produto';
  duracao: number; // em minutos
};

type TipoOS = {
  id: string;
  nome: string;
  descricao: string;
  itens: ServicoProduto[];
};

export default function Page() {
  const [tiposOS, setTiposOS] = useState<TipoOS[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalItemOpen, setIsModalItemOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [tipoEditandoId, setTipoEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [itens, setItens] = useState<ServicoProduto[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  // Form para adicionar itens
  const [novoItemNome, setNovoItemNome] = useState('');
  const [novoItemDescricao, setNovoItemDescricao] = useState('');
  const [novoItemPreco, setNovoItemPreco] = useState('');
  const [novoItemDesconto, setNovoItemDesconto] = useState('');
  const [novoItemTipo, setNovoItemTipo] = useState<'servico' | 'produto'>('servico');
  const [novoItemDuracao, setNovoItemDuracao] = useState('45');
  
  // Edição individual de item
  const [itemEditando, setItemEditando] = useState<ServicoProduto | null>(null);
  const [editItemNome, setEditItemNome] = useState('');
  const [editItemDescricao, setEditItemDescricao] = useState('');
  const [editItemPreco, setEditItemPreco] = useState('');
  const [editItemDesconto, setEditItemDesconto] = useState('');
  const [editItemTipo, setEditItemTipo] = useState<'servico' | 'produto'>('servico');
  const [editItemDuracao, setEditItemDuracao] = useState('30');

  // Carregar dados
  useEffect(() => {
    const dados = readArray<TipoOS>('tiposOs');
    setTiposOS(dados);
  }, []);

  // Salvar dados
  const abrirModal = (id?: string) => {
    if (id) {
      const tipo = tiposOS.find(t => t.id === id);
      if (tipo) {
        setEditandoId(id);
        setNome(tipo.nome);
        setDescricao(tipo.descricao);
        setItens(tipo.itens);
      }
    } else {
      setEditandoId(null);
      setNome('');
      setDescricao('');
      setItens([]);
    }
    setNovoItemNome('');
    setNovoItemDescricao('');
    setNovoItemPreco('');
    setNovoItemDesconto('');
    setNovoItemTipo('servico');
    setNovoItemDuracao('45');
    setIsModalOpen(true);
  };

  const fecharModal = () => {
    setIsModalOpen(false);
    setEditandoId(null);
    setNome('');
    setDescricao('');
    setItens([]);
  };

  const adicionarItem = () => {
    if (!novoItemNome || !novoItemPreco || !novoItemDuracao) {
      alert('Preencha todos os campos do item');
      return;
    }

    const novoItem: ServicoProduto = {
      id: `item_${Date.now()}`,
      nome: novoItemNome,
      descricao: novoItemDescricao,
      preco: currencyToNumber(novoItemPreco),
      desconto: currencyToNumber(novoItemDesconto) || 0,
      tipo: novoItemTipo,
      duracao: Number(novoItemDuracao)
    };
    setItens([...itens, novoItem]);
    
    setNovoItemNome('');
    setNovoItemDescricao('');
    setNovoItemPreco('');
    setNovoItemDesconto('');
    setNovoItemDuracao('45');
  };

  const removerItem = (itemId: string) => {
    setItens(itens.filter(i => i.id !== itemId));
  };

  // Funções para edição individual de item
  const abrirModalEditarItem = (tipoId: string, item: ServicoProduto) => {
    setTipoEditandoId(tipoId);
    setItemEditando(item);
    setEditItemNome(item.nome);
    setEditItemDescricao(item.descricao || '');
    setEditItemPreco(numberToCurrency(item.preco));
    setEditItemDesconto(numberToCurrency(item.desconto || 0));
    setEditItemTipo(item.tipo);
    setEditItemDuracao(String(item.duracao));
    setIsModalItemOpen(true);
  };

  const fecharModalItem = () => {
    setIsModalItemOpen(false);
    setItemEditando(null);
    setTipoEditandoId(null);
  };

  const salvarItemEditado = () => {
    if (!editItemNome || !editItemPreco || !editItemDuracao || !itemEditando || !tipoEditandoId) {
      alert('Preencha todos os campos do item');
      return;
    }

    const itemAtualizado: ServicoProduto = {
      ...itemEditando,
      nome: editItemNome,
      descricao: editItemDescricao,
      preco: currencyToNumber(editItemPreco),
      desconto: currencyToNumber(editItemDesconto) || 0,
      tipo: editItemTipo,
      duracao: Number(editItemDuracao)
    };

    const novosTipos = tiposOS.map(tipo => {
      if (tipo.id === tipoEditandoId) {
        return {
          ...tipo,
          itens: tipo.itens.map(item => 
            item.id === itemEditando.id ? itemAtualizado : item
          )
        };
      }
      return tipo;
    });

    writeArray('tiposOs', novosTipos);
    setTiposOS(novosTipos);
    fecharModalItem();
  };

  const deletarItemExpandido = (tipoId: string, itemId: string) => {
    if (!confirm('Tem certeza que deseja deletar este item?')) return;

    const novosTipos = tiposOS.map(tipo => {
      if (tipo.id === tipoId) {
        return {
          ...tipo,
          itens: tipo.itens.filter(item => item.id !== itemId)
        };
      }
      return tipo;
    });

    writeArray('tiposOs', novosTipos);
    setTiposOS(novosTipos);
  };

  const salvar = () => {
    if (!nome) {
      alert('Preencha o nome do tipo de OS');
      return;
    }

    let novosTipos: TipoOS[];

    if (editandoId) {
      novosTipos = tiposOS.map(t =>
        t.id === editandoId ? { id: editandoId, nome, descricao, itens } : t
      );
    } else {
      const novoTipo: TipoOS = {
        id: `tipo_${Date.now()}`,
        nome,
        descricao,
        itens
      };
      novosTipos = [...tiposOS, novoTipo];
    }

    writeArray('tiposOs', novosTipos);
    setTiposOS(novosTipos);
    fecharModal();
  };

  const deletar = (id: string) => {
    if (confirm('Tem certeza que deseja deletar?')) {
      const novosTipos = tiposOS.filter(t => t.id !== id);
      writeArray('tiposOs', novosTipos);
      setTiposOS(novosTipos);
    }
  };

  const alternarExpansao = (id: string) => {
    setExpandedIds((prev) => (
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Tipos de OS
          </h1>
          <p className="text-sm text-slate-700 dark:text-slate-400">
            Gerencie tipos de Ordens de Serviço com seus serviços e produtos
          </p>
        </div>
        <Button onClick={() => abrirModal()}>
          + Novo Tipo
        </Button>
      </div>

      {/* Tabela */}
      {tiposOS.length > 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
          <table className="w-full">
            <thead className="bg-slate-100 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Descrição
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Itens
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {tiposOS.map(tipo => {
                const isExpanded = expandedIds.includes(tipo.id);
                return (
                  <Fragment key={tipo.id}>
                    <tr
                      onClick={() => alternarExpansao(tipo.id)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer"
                    >
                      <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-medium">
                        <span>{tipo.nome}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-400 text-sm">
                        {tipo.descricao || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 px-3 py-1 text-sm font-semibold text-blue-700 dark:text-blue-200">
                          {tipo.itens.length}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirModal(tipo.id);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            Editar
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletar(tipo.id);
                            }}
                            variant="danger"
                            size="sm"
                          >
                            Deletar
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={4} className="px-6 pb-4">
                          <div className="mt-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4">
                            {tipo.itens.length > 0 ? (
                              <div className="space-y-3">
                                {tipo.itens.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex flex-col gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-start gap-2 flex-1">
                                        <span className="text-lg mt-0.5">
                                          {item.tipo === 'servico' ? '🔧' : '📦'}
                                        </span>
                                        <div className="flex-1">
                                          <p className="font-medium text-slate-900 dark:text-slate-100">
                                            {item.nome}
                                          </p>
                                          {item.descricao && (
                                            <p className="text-xs text-slate-700 dark:text-slate-400 mt-1">
                                              {item.descricao}
                                            </p>
                                          )}
                                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-700 dark:text-slate-400">
                                            <span>R$ {item.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            <span>• Desconto R$ {(item.desconto ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            <span>• ⏱️ {Math.floor(item.duracao / 60)}h {item.duracao % 60 > 0 ? `${item.duracao % 60}min` : ''}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex gap-2 flex-shrink-0">
                                        <Button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            abrirModalEditarItem(tipo.id, item);
                                          }}
                                          variant="outline"
                                          size="sm"
                                        >
                                          ✏️
                                        </Button>
                                        <Button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deletarItemExpandido(tipo.id, item.id);
                                          }}
                                          variant="danger"
                                          size="sm"
                                        >
                                          ✕
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center text-sm text-slate-700 dark:text-slate-400">
                                Nenhum item cadastrado para este tipo.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-700 dark:text-slate-400 mb-4">
            Nenhum tipo de OS cadastrado
          </p>
          <Button onClick={() => abrirModal()}>
            + Adicionar Tipo
          </Button>
        </div>
      )}

      {/* Modal */}
      <Modal 
        open={isModalOpen} 
        onClose={fecharModal} 
        title={editandoId ? 'Editar Informações do Tipo' : 'Novo Tipo de OS'}
        className="max-w-7xl max-h-[90vh] overflow-y-auto"
        showFooter={false}
      >
        <div className="space-y-5">
          {/* Informações do Tipo */}
          <div>
            <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Informações Básicas
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome do Tipo"
                placeholder="Ex: Manutenção Preventiva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
              <Input
                label="Descrição"
                placeholder="Descrição do tipo de OS"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
          </div>

          {/* Divisor */}
          <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600" />

          {/* Serviços e Produtos */}
          <div>
            <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Serviços & Produtos
            </p>

            {/* Formulário para adicionar item - apenas ao criar novo tipo */}
            {!editandoId && (
              <div className="rounded-lg bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 p-4 mb-4">
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
                  <div className="lg:col-span-2">
                    <Input
                      label="Nome"
                      placeholder="Nome do serviço/produto"
                      value={novoItemNome}
                      onChange={(e) => setNovoItemNome(e.target.value)}
                    />
                  </div>
                  <MaskedInput
                    label="Preço (R$)"
                    mask="currency"
                    placeholder="R$ 0,00"
                    value={novoItemPreco}
                    onChange={setNovoItemPreco}
                  />
                  <MaskedInput
                    label="Desconto (R$)"
                    mask="currency"
                    placeholder="R$ 0,00"
                    value={novoItemDesconto}
                    onChange={setNovoItemDesconto}
                  />
                  <Select
                    label="Duração"
                    value={novoItemDuracao}
                    onChange={setNovoItemDuracao}
                    options={[
                      { value: '45', label: '⏱️ 45 min' },
                      { value: '60', label: '⏱️ 01h' },
                      { value: '75', label: '⏱️ 01h 15min' },
                      { value: '90', label: '⏱️ 01h 30min' },
                      { value: '105', label: '⏱️ 01h 45min' },
                      { value: '120', label: '⏱️ 02h' }
                    ]}
                  />
                  <Select
                    label="Tipo"
                    value={novoItemTipo}
                    onChange={(value) => setNovoItemTipo(value as 'servico' | 'produto')}
                    options={[
                      { value: 'servico', label: '🔧 Serviço' },
                      { value: 'produto', label: '📦 Produto' }
                    ]}
                  />
                </div>
                <Input
                  label="Descrição (opcional)"
                  placeholder="Descrição detalhada do item"
                  value={novoItemDescricao}
                  onChange={(e) => setNovoItemDescricao(e.target.value)}
                />
                <Button onClick={adicionarItem} className="w-full">
                  + Adicionar Item
                </Button>
              </div>
            </div>
            )}

            {/* Mensagem quando estiver editando */}
            {editandoId && (
              <div className="mb-4 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ℹ️ Para editar ou adicionar novos itens, expanda a linha deste tipo na tabela principal e clique no ícone ✏️ de cada item.
                </p>
              </div>
            )}

            {/* Lista de itens */}
            {itens.length > 0 ? (
              <div className="space-y-3">
                {itens.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="text-lg flex-shrink-0 mt-1">
                          {item.tipo === 'servico' ? '🔧' : '📦'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 dark:text-slate-100 break-words">
                            {item.nome}
                          </p>
                          {item.descricao && (
                            <p className="text-xs text-slate-700 dark:text-slate-400 mt-1">
                              {item.descricao}
                            </p>
                          )}
                          <p className="text-xs text-slate-700 dark:text-slate-400 mt-2">
                            R$ {item.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • Desconto R$ {(item.desconto ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • ⏱️ {Math.floor(item.duracao / 60)}h {item.duracao % 60 > 0 ? `${item.duracao % 60}min` : ''}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => removerItem(item.id)}
                        variant="danger"
                        size="sm"
                        className="flex-shrink-0"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-sm text-slate-700 dark:text-slate-400">
                  {editandoId 
                    ? 'Nenhum item cadastrado para este tipo.' 
                    : 'Nenhum item adicionado. Adicione serviços ou produtos acima!'}
                </p>
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={fecharModal} size="sm" className="min-w-[120px]">
              Cancelar
            </Button>
            <Button onClick={salvar} size="sm" className="min-w-[120px]">
              {editandoId ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Edição Individual de Item */}
      <Modal
        open={isModalItemOpen}
        onClose={fecharModalItem}
        title="Editar Item"
        className="max-w-2xl"
        showFooter={false}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome *"
              placeholder="Nome do serviço/produto"
              value={editItemNome}
              onChange={(e) => setEditItemNome(e.target.value)}
            />
            <Select
              label="Tipo"
              value={editItemTipo}
              onChange={(value) => setEditItemTipo(value as 'servico' | 'produto')}
              options={[
                { value: 'servico', label: '🔧 Serviço' },
                { value: 'produto', label: '📦 Produto' }
              ]}
            />
          </div>

          <Input
            label="Descrição (opcional)"
            placeholder="Descrição detalhada do item"
            value={editItemDescricao}
            onChange={(e) => setEditItemDescricao(e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MaskedInput
              label="Preço (R$) *"
              mask="currency"
              placeholder="R$ 0,00"
              value={editItemPreco}
              onChange={setEditItemPreco}
            />
            <MaskedInput
              label="Desconto (R$)"
              mask="currency"
              placeholder="R$ 0,00"
              value={editItemDesconto}
              onChange={setEditItemDesconto}
            />
            <Select
              label="Duração *"
              value={editItemDuracao}
              onChange={setEditItemDuracao}
              options={[
                { value: '45', label: '⏱️ 45 min' },
                { value: '60', label: '⏱️ 01h' },
                { value: '75', label: '⏱️ 01h 15min' },
                { value: '90', label: '⏱️ 01h 30min' },
                { value: '105', label: '⏱️ 01h 45min' },
                { value: '120', label: '⏱️ 02h' }
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="secondary" onClick={fecharModalItem}>
              Cancelar
            </Button>
            <Button onClick={salvarItemEditado}>
              Salvar Alterações
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
