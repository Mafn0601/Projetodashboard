'use client';

import { useState, useEffect, Fragment, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { MaskedInput } from '@/components/ui/MaskedInput';
import { equipeServiceAPI } from '@/services/equipeServiceAPI';
import { parceiroServiceAPI } from '@/services/parceiroServiceAPI';

type Parceiro = {
  id: string;
  nome: string;
  [key: string]: unknown;
};

type Equipe = {
  id: string;
  parceiroId?: string;
  parceiro?: string;
  login?: string;
  cpf?: string;
  funcao: string;
  telefone?: string;
  email?: string;
  estado?: string;
  comissaoAtiva: boolean;
  agencia?: string;
  contaCorrente?: string;
  banco?: string;
  meioPagamento?: string;
  cpfCnpjRecebimento?: string;
  tipoComissao?: string;
  valorComissao?: string;
  ativo?: boolean;
};

// ===== OPÇÕES DE SELEÇÃO =====

// Funções / Papéis da Equipe
const funcoes = [
  { value: "admin", label: "ADMIN" },
  { value: "consultor_vendas", label: "Consultor de Vendas" },
  { value: "gerente_vendas", label: "Gerente de Vendas" },
  { value: "gerente_comercial", label: "Gerente Comercial" },
  { value: "operador", label: "Operador" },
  { value: "auxiliar_administrativo", label: "Auxiliar Administrativo" },
  { value: "tecnico", label: "Técnico" }
];

// Meios de Pagamento para Comissão
const meioPagamentoOptions = [
  { value: "pix", label: "PIX" },
  { value: "transferencia", label: "Transferência Bancária" },
  { value: "ted", label: "TED" },
  { value: "doc", label: "DOC" }
];

// Tipos de Comissão
const tipoComissaoOptions = [
  { value: "percentual", label: "Percentual (%)" },
  { value: "monetario", label: "Valor Fixo (R$)" }
];

// Estados do Brasil (Alfabético)
const estadosBrasil = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" }
];

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export default function Page() {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [parceiroOptions, setParceiroOptions] = useState<SelectOption[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEquipe, setSelectedEquipe] = useState<Equipe | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedParceiros, setExpandedParceiros] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const didInitExpand = useRef(false);
  const [formData, setFormData] = useState<Equipe>({
    id: '',
    parceiroId: '',
    cpf: '',
    funcao: '',
    telefone: '',
    email: '',
    estado: '',
    comissaoAtiva: false,
    agencia: '',
    contaCorrente: '',
    banco: '',
    meioPagamento: '',
    cpfCnpjRecebimento: '',
    tipoComissao: '',
    valorComissao: '',
    ativo: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const carregarDados = async (options?: { silent?: boolean; forceRefresh?: boolean }) => {
    const silent = options?.silent ?? false;
    const forceRefresh = options?.forceRefresh ?? false;

    try {
      if (!silent) {
        setIsLoading(true);
      }
      
      // Carregar da API em paralelo
      const [parceirosData, equipesData] = await Promise.all([
        parceiroServiceAPI.findAll({ preferCache: !forceRefresh, forceRefresh }),
        equipeServiceAPI.findAll(undefined, undefined, { preferCache: !forceRefresh, forceRefresh })
      ]);
      
      setParceiros(parceirosData as unknown as Parceiro[]);
      setParceiroOptions(parceirosData.map(p => ({ value: p.id, label: p.nome })));
      setEquipes(equipesData as unknown as Equipe[]);
    } catch (error) {
      console.warn('Erro ao carregar dados da API/cache da API:', error);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const cachedParceiros = parceiroServiceAPI.getCached();
    const cachedEquipes = equipeServiceAPI.getCached();

    if (cachedParceiros.length > 0 || cachedEquipes.length > 0) {
      setParceiros(cachedParceiros as unknown as Parceiro[]);
      setParceiroOptions(cachedParceiros.map(p => ({ value: p.id, label: p.nome })));
      setEquipes(cachedEquipes as unknown as Equipe[]);
      setIsLoading(false);
      carregarDados({ silent: true, forceRefresh: true });
      return;
    }

    carregarDados({ forceRefresh: true });
  }, []);

  // Recarregar dados quando a página ganha foco (volta de outra página)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        carregarDados({ silent: true, forceRefresh: true });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const resetForm = () => {
    setFormData({
      id: '',
      parceiroId: '',
      cpf: '',
      funcao: '',
      telefone: '',
      email: '',
      estado: '',
      comissaoAtiva: false,
      agencia: '',
      contaCorrente: '',
      banco: '',
      meioPagamento: '',
      cpfCnpjRecebimento: '',
      tipoComissao: '',
      valorComissao: '',
      ativo: true
    });
    setErrors({});
    setEditingId(null);
  };

  const handleChange = (field: keyof Equipe, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.parceiroId) newErrors.parceiroId = 'Campo obrigatório';
    if (!formData.cpf) newErrors.cpf = 'Campo obrigatório';
    if (!formData.funcao) newErrors.funcao = 'Campo obrigatório';
    if (!formData.email) newErrors.email = 'Campo obrigatório';
    
    if (formData.comissaoAtiva && !formData.meioPagamento) {
      newErrors.meioPagamento = 'Campo obrigatório quando comissão ativa';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      if (editingId) {
        // Atualizar - parceiroId não pode ser alterado
        const dataToUpdate = {
          cpf: formData.cpf?.replace(/\D/g, '') || '',
          funcao: formData.funcao,
          telefone: formData.telefone?.replace(/\D/g, '') || '',
          email: formData.email,
          estado: formData.estado,
          comissaoAtiva: formData.comissaoAtiva,
          agencia: formData.agencia,
          contaCorrente: formData.contaCorrente,
          banco: formData.banco,
          meioPagamento: formData.meioPagamento,
          cpfCnpjRecebimento: formData.cpfCnpjRecebimento?.replace(/\D/g, '') || '',
          tipoComissao: formData.tipoComissao,
          valorComissao: formData.valorComissao,
          ativo: formData.ativo ?? true,
        };
        const equipeAtualizada = await equipeServiceAPI.update(editingId, dataToUpdate);
        setEquipes(prev => prev.map(e => e.id === editingId ? equipeAtualizada as unknown as Equipe : e));
      } else {
        // Criar - parceiroId é obrigatório
        const dataToCreate = {
          cpf: formData.cpf?.replace(/\D/g, '') || '',
          funcao: formData.funcao,
          telefone: formData.telefone?.replace(/\D/g, '') || '',
          email: formData.email,
          estado: formData.estado,
          comissaoAtiva: formData.comissaoAtiva,
          agencia: formData.agencia,
          contaCorrente: formData.contaCorrente,
          banco: formData.banco,
          meioPagamento: formData.meioPagamento,
          cpfCnpjRecebimento: formData.cpfCnpjRecebimento?.replace(/\D/g, '') || '',
          tipoComissao: formData.tipoComissao,
          valorComissao: formData.valorComissao,
          parceiroId: formData.parceiroId || '',
          ativo: formData.ativo ?? true,
        };
        const novaEquipe = await equipeServiceAPI.create(dataToCreate);
        setEquipes(prev => [...prev, novaEquipe as unknown as Equipe]);
      }

      setIsModalOpen(false);
      resetForm();
      console.log('✅ Equipe salva com sucesso. Lista atualizada.');
    } catch (error) {
      console.error('Erro ao salvar equipe:', error);
      setErrors({ submit: String(error) });
    }
  };

  const handleEdit = (equipe: Equipe) => {
    setFormData(equipe);
    setEditingId(equipe.id);
    setIsModalOpen(true);
  };

  const handleViewDetails = (equipe: Equipe) => {
    setSelectedEquipe(equipe);
  };

  const closeDetailsModal = () => {
    setSelectedEquipe(null);
  };

  const handleEditFromDetails = () => {
    if (!selectedEquipe) return;
    handleEdit(selectedEquipe);
    closeDetailsModal();
  };

  const handleDelete = async () => {
    if (!editingId) return;

    try {
      const equipeRemovida = equipes.find(e => e.id === editingId);
      await equipeServiceAPI.delete(editingId);
      setEquipes(prev => prev.filter(e => e.id !== editingId));

      if (equipeRemovida) {
        const rawUser = localStorage.getItem('user');
        if (rawUser) {
          try {
            const currentUser = JSON.parse(rawUser) as { email?: string };
            const currentIdentifier = String(currentUser.email ?? '').toLowerCase();
            const removedEmail = String(equipeRemovida.email ?? '').toLowerCase();
            if (currentIdentifier && currentIdentifier === removedEmail) {
              localStorage.removeItem('user');
            }
          } catch {}
        }
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao deletar equipe:', error);
      alert('Erro ao deletar equipe');
    }
  };

  const obterLabelParceiro = (parceiroId: string): string => {
    const parceiro = parceiros.find(p => p.id === parceiroId);
    return parceiro ? parceiro.nome : parceiroId;
  };

  const obterLabelFuncao = (funcaoValue: string): string => {
    const funcao = funcoes.find(f => f.value === funcaoValue);
    return funcao ? funcao.label : funcaoValue;
  };

  const filteredEquipes = useMemo(() => {
    return equipes.filter(equipe => {
      const term = searchTerm.toLowerCase();
      const parceiroNome = obterLabelParceiro(equipe.parceiroId || '').toLowerCase();
      const funcaoLabel = obterLabelFuncao(equipe.funcao).toLowerCase();
      
      return (
        String(equipe.email || '').toLowerCase().includes(term) ||
        (equipe.cpf && equipe.cpf.includes(term)) ||
        parceiroNome.includes(term) ||
        funcaoLabel.includes(term)
      );
    });
  }, [equipes, searchTerm, parceiros]);

  // Mapa de hierarquia das funções (menor número = maior hierarquia)
  const hierarquiaFuncoes: Record<string, number> = useMemo(() => ({
    'admin': 0,
    'gerente_comercial': 1,
    'auxiliar_administrativo': 2,
    'tecnico': 3,
    'gerente_vendas': 4,
    'consultor_vendas': 5,
    'operador': 6
  }), []);

  // Função para obter o nível de hierarquia
  const obterNivelHierarquia = (funcao: string): number => {
    return hierarquiaFuncoes[funcao] ?? 999; // 999 para funções desconhecidas
  };

  // Agrupar e ordenar equipes (otimizado com useMemo)
  const groupedEquipes = useMemo(() => {
    const grouped = filteredEquipes.reduce<Record<string, Equipe[]>>((acc, equipe) => {
      const key = equipe.parceiroId || 'sem_parceiro';
      if (!acc[key]) acc[key] = [];
      acc[key].push(equipe);
      return acc;
    }, {});

    // Ordenar membros de cada grupo por hierarquia
    Object.keys(grouped).forEach((parceiroId) => {
      grouped[parceiroId].sort((a, b) => {
        return obterNivelHierarquia(a.funcao) - obterNivelHierarquia(b.funcao);
      });
    });

    return grouped;
  }, [filteredEquipes, hierarquiaFuncoes]);

  const partnerIds = useMemo(() => Object.keys(groupedEquipes), [groupedEquipes]);

  useEffect(() => {
    if (!didInitExpand.current && partnerIds.length > 0) {
      setExpandedParceiros(partnerIds);
      didInitExpand.current = true;
    }
  }, [partnerIds]);

  const alternarGrupo = (parceiroId: string) => {
    setExpandedParceiros((prev) => (
      prev.includes(parceiroId)
        ? prev.filter((id) => id !== parceiroId)
        : [...prev, parceiroId]
    ));
  };

  const expandirTodos = () => {
    setExpandedParceiros(partnerIds);
  };

  const recolherTodos = () => {
    setExpandedParceiros([]);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
              Cadastro de Vendedores
            </h1>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Gerencie os vendedores vinculados as concessionarias
            </p>
          </div>
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
            + Novo Cadastro
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={expandirTodos}
            disabled={partnerIds.length === 0}
          >
            Expandir tudo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={recolherTodos}
            disabled={partnerIds.length === 0}
          >
            Recolher tudo
          </Button>
        </div>
        <div className="w-full sm:w-1/4">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar..."
          />
        </div>
      </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-100"></div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Carregando equipes...</p>
            </div>
          </div>
        )}

      {/* Table */}
        {!isLoading && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Concessionaria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                E-mail
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                CPF
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Função
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Comissão
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {Object.entries(groupedEquipes).map(([parceiroId, membros]) => {
              const isExpanded = expandedParceiros.includes(parceiroId);
              const parceiroLabel = parceiroId === 'sem_parceiro' ? 'Sem concessionaria' : obterLabelParceiro(parceiroId);
              return (
                <Fragment key={parceiroId}>
                  <tr
                    className="bg-slate-50 dark:bg-slate-900/60 cursor-pointer"
                    onClick={() => alternarGrupo(parceiroId)}
                  >
                    <td className="px-6 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100" colSpan={6}>
                      <div className="flex items-center justify-between">
                        <span>{parceiroLabel}</span>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-400">
                          {membros.length} vendedor(es)
                        </span>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && membros.map((equipe) => (
                    <tr
                      key={equipe.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                      onClick={() => handleViewDetails(equipe)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                        {obterLabelParceiro(equipe.parceiroId || '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                        {equipe.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100 font-mono">
                        {equipe.cpf}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                        {obterLabelFuncao(equipe.funcao)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {equipe.comissaoAtiva ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            Ativa
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300">
                            Inativa
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEdit(equipe);
                          }}
                          size="sm"
                          variant="secondary"
                        >
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        </div>

        <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
          {Object.entries(groupedEquipes).map(([parceiroId, membros]) => {
            const isExpanded = expandedParceiros.includes(parceiroId);
            const parceiroLabel = parceiroId === 'sem_parceiro' ? 'Sem concessionaria' : obterLabelParceiro(parceiroId);

            return (
              <div key={parceiroId}>
                <button
                  type="button"
                  className="w-full bg-slate-50 dark:bg-slate-900/60 px-4 py-3 text-left"
                  onClick={() => alternarGrupo(parceiroId)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{parceiroLabel}</span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-400">
                      {membros.length} vendedor(es)
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="space-y-3 p-3">
                    {membros.map((equipe) => (
                      <div
                        key={equipe.id}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3"
                      >
                        <div className="space-y-1.5 text-sm">
                          <p className="text-slate-900 dark:text-slate-100">
                            <span className="font-medium">E-mail:</span> {equipe.email || '-'}
                          </p>
                          <p className="text-slate-900 dark:text-slate-100 font-mono">
                            <span className="font-medium not-italic">CPF:</span> {equipe.cpf}
                          </p>
                          <p className="text-slate-900 dark:text-slate-100">
                            <span className="font-medium">Função:</span> {obterLabelFuncao(equipe.funcao)}
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="font-medium text-slate-900 dark:text-slate-100">Comissão:</span>
                            {equipe.comissaoAtiva ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                Ativa
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300">
                                Inativa
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-3">
                          <Button onClick={() => handleEdit(equipe)} size="sm" variant="secondary" className="w-full">
                            Editar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Modal de Visualização (Desktop) */}
      {selectedEquipe && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]"
          onClick={(e) => e.target === e.currentTarget && closeDetailsModal()}
        >
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-6">
                Detalhes do Vendedor
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">Concessionaria</p>
                  <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                    {obterLabelParceiro(selectedEquipe.parceiroId || '')}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">E-mail</p>
                  <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">{selectedEquipe.email || '-'}</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">CPF</p>
                  <p className="text-sm text-slate-900 dark:text-slate-100 font-mono">{selectedEquipe.cpf || '-'}</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">Função</p>
                  <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                    {obterLabelFuncao(selectedEquipe.funcao)}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">E-mail</p>
                  <p className="text-sm text-slate-900 dark:text-slate-100">{selectedEquipe.email || '-'}</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">Telefone</p>
                  <p className="text-sm text-slate-900 dark:text-slate-100">{selectedEquipe.telefone || '-'}</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 md:col-span-2">
                  <p className="text-xs text-slate-700 dark:text-slate-400 mb-1">Comissão</p>
                  {selectedEquipe.comissaoAtiva ? (
                    <div className="space-y-1 text-sm text-slate-900 dark:text-slate-100">
                      <p><span className="font-medium">Status:</span> Ativa</p>
                      <p><span className="font-medium">Meio de pagamento:</span> {selectedEquipe.meioPagamento || '-'}</p>
                      <p><span className="font-medium">Tipo:</span> {selectedEquipe.tipoComissao || '-'}</p>
                      <p><span className="font-medium">Valor:</span> {selectedEquipe.valorComissao || '-'}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-900 dark:text-slate-100">Inativa</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button onClick={closeDetailsModal} variant="secondary" size="sm">
                  Fechar
                </Button>
                <Button onClick={handleEditFromDetails} size="sm">
                  Editar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]"
          onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
        >
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-6">
                {editingId ? 'Editar Vendedor' : 'Novo Vendedor'}
              </h2>

              {/* Informações Básicas */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-4">
                  Informações Básicas
                </h3>
                <div className="space-y-4">
                  <Select
                    label="Concessionaria *"
                    value={formData.parceiroId || ''}
                    onChange={(value) => handleChange('parceiroId', value)}
                    options={parceiroOptions}
                    error={errors.parceiroId}
                  />
                  <Input
                    label="E-mail *"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    error={errors.email}
                  />
                  <MaskedInput
                    label="CPF *"
                    value={formData.cpf}
                    onChange={(value) => handleChange('cpf', value)}
                    mask="cpfCnpj"
                    error={errors.cpf}
                  />
                  <Select
                    label="Função *"
                    value={formData.funcao}
                    onChange={(value) => handleChange('funcao', value)}
                    options={funcoes}
                    error={errors.funcao}
                  />
                  <MaskedInput
                    label="Telefone"
                    value={formData.telefone || ''}
                    onChange={(value) => handleChange('telefone', value)}
                    mask="phone"
                  />
                  <Select
                    label="Estado"
                    value={formData.estado || ''}
                    onChange={(value) => handleChange('estado', value)}
                    options={estadosBrasil}
                  />
                </div>
              </div>

              {/* Comissão */}
              <div className="mb-6 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="comissaoAtiva"
                    checked={formData.comissaoAtiva}
                    onChange={(e) => handleChange('comissaoAtiva', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="comissaoAtiva" className="ml-2 text-sm font-medium text-slate-900 dark:text-slate-50">
                    Comissão
                  </label>
                </div>

                {formData.comissaoAtiva && (
                  <div className="space-y-4 pl-6">
                    <Input
                      label="Agência"
                      value={formData.agencia || ''}
                      onChange={(e) => handleChange('agencia', e.target.value)}
                    />
                    <Input
                      label="Conta Corrente"
                      value={formData.contaCorrente || ''}
                      onChange={(e) => handleChange('contaCorrente', e.target.value)}
                    />
                    <Input
                      label="Banco"
                      value={formData.banco || ''}
                      onChange={(e) => handleChange('banco', e.target.value)}
                    />
                    <Select
                      label="Meio de Pagamento *"
                      value={formData.meioPagamento || ''}
                      onChange={(value) => handleChange('meioPagamento', value)}
                      options={meioPagamentoOptions}
                      error={errors.meioPagamento}
                    />
                    <MaskedInput
                      label="CPF ou CNPJ do Recebimento"
                      value={formData.cpfCnpjRecebimento || ''}
                      onChange={(value) => handleChange('cpfCnpjRecebimento', value)}
                      mask="cpfCnpj"
                    />
                    <Select
                      label="Tipo de Comissão"
                      value={formData.tipoComissao || ''}
                      onChange={(value) => handleChange('tipoComissao', value)}
                      options={tipoComissaoOptions}
                    />
                    <Input
                      label="Valor da Comissão"
                      value={formData.valorComissao || ''}
                      onChange={(e) => handleChange('valorComissao', e.target.value)}
                      placeholder={formData.tipoComissao === 'percentual' ? 'Ex: 5' : 'Ex: 50.00'}
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3">
                <Button 
                  onClick={() => { setIsModalOpen(false); resetForm(); }} 
                  variant="secondary"
                  size="sm"
                >
                  Cancelar
                </Button>
                {editingId && (
                  <Button 
                    onClick={handleDelete} 
                    variant="danger"
                    size="sm"
                  >
                    Deletar
                  </Button>
                )}
                <Button onClick={handleSubmit} size="sm">
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

