'use client';

import { useState, useEffect, Fragment } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MaskedInput, currencyToNumber, numberToCurrency } from '@/components/ui/MaskedInput';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import tipoOSServiceAPI, { TipoOS, TipoOSItem } from '@/services/tipoOSServiceAPI';

export default function Page() {
  const [tiposOS, setTiposOS] = useState<TipoOS[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalItemOpen, setIsModalItemOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [tipoSelecionadoId, setTipoSelecionadoId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  // Form para adicionar/editar item
  const [itemEditando, setItemEditando] = useState<TipoOSItem | null>(null);
  const [itemNome, setItemNome] = useState('');
  const [itemPreco, setItemPreco] = useState('');
  const [itemDesconto, setItemDesconto] = useState('');
  const [itemTipo, setItemTipo] = useState<'SERVICO' | 'PRODUTO'>('SERVICO');
  const [itemDuracao, setItemDuracao] = useState('45');

  // Carregar dados com cache
  const carregarTipos = async (options?: { forceRefresh?: boolean }) => {
    try {
      setLoading(true);
      const dados = await tipoOSServiceAPI.findAll({ preferCache: true, forceRefresh: options?.forceRefresh });
      setTiposOS(dados);
    } catch (error) {
      console.error('Erro ao carregar tipos de OS:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTipos();
  }, []);

  const abrirModal = (id?: string) => {
    if (id) {
      const tipo = tiposOS.find(t => t.id === id);
      if (tipo) {
        setEditandoId(id);
        setNome(tipo.nome);
        setDescricao(tipo.descricao || '');
      }
    } else {
      setEditandoId(null);
      setNome('');
      setDescricao('');
    }
    setIsModalOpen(true);
  };

  const fecharModal = () => {
    setIsModalOpen(false);
    setEditandoId(null);
    setNome('');
    setDescricao('');
  };

  const salvarTipo = async () => {
    if (!nome) {
      alert('Preencha o nome do tipo de OS');
      return;
    }

    try {
      if (editandoId) {
        await tipoOSServiceAPI.update(editandoId, { nome, descricao });
      } else {
        await tipoOSServiceAPI.create({ nome, descricao });
      }
      await carregarTipos({ forceRefresh: true });
      fecharModal();
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar tipo de OS');
    }
  };

  const deletarTipo = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este tipo de OS e todos os seus itens?')) return;

    try {
      await tipoOSServiceAPI.delete(id);
      await carregarTipos({ forceRefresh: true });
    } catch (error: any) {
      alert(error.message || 'Erro ao deletar tipo de OS');
    }
  };

  // Funções para itens
  const abrirModalItem = (tipoId: string, item?: TipoOSItem) => {
    setTipoSelecionadoId(tipoId);
    if (item) {
      setItemEditando(item);
      setItemNome(item.nome);
      setItemPreco(numberToCurrency(item.preco));
      setItemDesconto(numberToCurrency(item.desconto || 0));
      setItemTipo(item.tipo);
      setItemDuracao(String(item.duracao || 45));
    } else {
      setItemEditando(null);
      setItemNome('');
      setItemPreco('');
      setItemDesconto('');
      setItemTipo('SERVICO');
      setItemDuracao('45');
    }
    setIsModalItemOpen(true);
  };

  const fecharModalItem = () => {
    setIsModalItemOpen(false);
    setItemEditando(null);
    setTipoSelecionadoId(null);
    setItemNome('');
    setItemPreco('');
    setItemDesconto('');
    setItemTipo('SERVICO');
    setItemDuracao('45');
  };

  const salvarItem = async () => {
    if (!itemNome || !itemPreco || !itemDuracao || !tipoSelecionadoId) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const data = {
        tipoOSId: tipoSelecionadoId,
        nome: itemNome,
        tipo: itemTipo,
        preco: currencyToNumber(itemPreco),
        desconto: currencyToNumber(itemDesconto) || 0,
        duracao: Number(itemDuracao),
      };

      if (itemEditando) {
        await tipoOSServiceAPI.updateItem(itemEditando.id, {
          nome: data.nome,
          tipo: data.tipo,
          preco: data.preco,
          desconto: data.desconto,
          duracao: data.duracao,
        });
      } else {
        await tipoOSServiceAPI.createItem(data);
      }

      await carregarTipos({ forceRefresh: true });
      fecharModalItem();
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar item');
    }
  };

  const deletarItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja deletar este item?')) return;

    try {
      await tipoOSServiceAPI.deleteItem(itemId);
      await carregarTipos({ forceRefresh: true });
    } catch (error: any) {
      alert(error.message || 'Erro ao deletar item');
    }
  };

  const alternarExpansao = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-700 dark:text-slate-400">Carregando...</p>
      </div>
    );
  }
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
        <Button onClick={() => abrirModal()}>+ Novo Tipo</Button>
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
                              deletarTipo(tipo.id);
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
                                            <span>• Desconto Máx. R$ {(item.descontoMaximo ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            <span>• ⏱️ {Math.floor(item.duracao / 60)}h {item.duracao % 60 > 0 ? `${item.duracao % 60}min` : ''}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex gap-2 flex-shrink-0">
                                        <Button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            abrirModalItem(tipo.id, item);
                                          }}
                                          variant="outline"
                                          size="sm"
                                        >
                                          ✏️
                                        </Button>
                                        <Button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deletarItem(item.id);
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

          {/* Serviços e Produtos - apenas quando editando */}
          {editandoId && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Serviços & Produtos
                </p>
                <Button
                  onClick={() => abrirModalItem(editandoId)}
                  size="sm"
                >
                  + Adicionar Item
                </Button>
              </div>

              {/* Lista de itens */}
              {(() => {
                const tipoAtual = tiposOS.find(t => t.id === editandoId);
                const itensDoTipo = tipoAtual?.itens || [];
                
                return itensDoTipo.length > 0 ? (
                  <div className="space-y-3">
                    {itensDoTipo.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3"
                      >
                        <div className="flex items-start gap-2 flex-1">
                          <span className="text-lg mt-0.5">
                            {item.tipo === 'SERVICO' ? '🔧' : '📦'}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {item.nome}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-700 dark:text-slate-400">
                              <span>
                                R${' '}
                                {item.preco.toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                              <span>
                                • Desconto Máx. R${' '}
                                {(item.desconto ?? 0).toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                              {item.duracao && (
                                <span>
                                  • ⏱️ {Math.floor(item.duracao / 60)}h{' '}
                                  {item.duracao % 60 > 0 ? `${item.duracao % 60}min` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            onClick={() => abrirModalItem(editandoId, item)}
                            variant="outline"
                            size="sm"
                          >
                            ✏️
                          </Button>
                          <Button
                            onClick={() => deletarItem(item.id)}
                            variant="danger"
                            size="sm"
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
                      Nenhum item cadastrado. Clique em "+ Adicionar Item" acima.
                    </p>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={fecharModal} size="sm" className="min-w-[120px]">
              Cancelar
            </Button>
            <Button onClick={salvarTipo} size="sm" className="min-w-[120px]">
              {editandoId ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Item */}
      <Modal
        open={isModalItemOpen}
        onClose={fecharModalItem}
        title={itemEditando ? 'Editar Item' : 'Novo Item'}
        className="max-w-2xl"
        showFooter={false}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome *"
              placeholder="Nome do serviço/produto"
              value={itemNome}
              onChange={(e) => setItemNome(e.target.value)}
            />
            <Select
              label="Tipo"
              value={itemTipo}
              onChange={(value) => setItemTipo(value as 'SERVICO' | 'PRODUTO')}
              options={[
                { value: 'SERVICO', label: '🔧 Serviço' },
                { value: 'PRODUTO', label: '📦 Produto' },
              ]}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MaskedInput
              label="Preço (R$) *"
              mask="currency"
              placeholder="R$ 0,00"
              value={itemPreco}
              onChange={setItemPreco}
            />
            <MaskedInput
              label="Desconto Máx. (R$)"
              mask="currency"
              placeholder="R$ 0,00"
              value={itemDesconto}
              onChange={setItemDesconto}
            />
            <Select
              label="Duração *"
              value={itemDuracao}
              onChange={setItemDuracao}
              options={[
                { value: '45', label: '⏱️ 45 min' },
                { value: '60', label: '⏱️ 01h' },
                { value: '75', label: '⏱️ 01h 15min' },
                { value: '90', label: '⏱️ 01h 30min' },
                { value: '105', label: '⏱️ 01h 45min' },
                { value: '120', label: '⏱️ 02h' },
              ]}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="secondary" onClick={fecharModalItem}>
              Cancelar
            </Button>
            <Button onClick={salvarItem}>
              {itemEditando ? 'Salvar Alterações' : 'Adicionar Item'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
