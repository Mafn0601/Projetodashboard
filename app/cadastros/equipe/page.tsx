'use client';

import { useState, useEffect, Fragment, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { MaskedInput } from '@/components/ui/MaskedInput';
import { readArray, appendItem } from '@/lib/storage';

type Parceiro = {
  id: string;
  nome: string;
  [key: string]: unknown;
};

type Equipe = {
  id: string;
  parceiro: string;
  login: string;
  senha?: string;
  cpf: string;
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
};

// ===== OPÇÕES DE SELEÇÃO =====

// Funções / Papéis da Equipe
const funcoes = [
  { value: "consultor_vendas", label: "Consultor de Vendas" },
  { value: "gerente_vendas", label: "Gerente de Vendas" },
  { value: "operador", label: "Operador" }
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedParceiros, setExpandedParceiros] = useState<string[]>([]);
  const didInitExpand = useRef(false);
  const [formData, setFormData] = useState<Equipe>({
    id: '',
    parceiro: '',
    login: '',
    senha: '',
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
    valorComissao: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const equipesData = readArray<Equipe>('equipes');
    setEquipes(equipesData);

    const parceirosData = readArray<Parceiro>('parceiros');
    setParceiros(parceirosData);
    setParceiroOptions(parceirosData.map(p => ({ value: p.id, label: p.nome })));
  }, []);

  const resetForm = () => {
    setFormData({
      id: '',
      parceiro: '',
      login: '',
      senha: '',
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
      valorComissao: ''
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
    
    if (!formData.parceiro) newErrors.parceiro = 'Campo obrigatório';
    if (!formData.login) newErrors.login = 'Campo obrigatório';
    if (!formData.senha) newErrors.senha = 'Campo obrigatório';
    if (!formData.cpf) newErrors.cpf = 'Campo obrigatório';
    if (!formData.funcao) newErrors.funcao = 'Campo obrigatório';
    if (!formData.email) newErrors.email = 'Campo obrigatório';
    
    if (formData.comissaoAtiva && !formData.meioPagamento) {
      newErrors.meioPagamento = 'Campo obrigatório quando comissão ativa';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const newEquipe: Equipe = {
      ...formData,
      id: editingId || generateId('equipe')
    };

    if (editingId) {
      const equipesAtualizadas = equipes.map(e => e.id === editingId ? newEquipe : e);
      localStorage.setItem('equipes', JSON.stringify(equipesAtualizadas));
      setEquipes(equipesAtualizadas);
    } else {
      appendItem('equipes', newEquipe);
      setEquipes(prev => [...prev, newEquipe]);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (equipe: Equipe) => {
    setFormData(equipe);
    setEditingId(equipe.id);
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (!editingId) return;

    const equipeRemovida = equipes.find(e => e.id === editingId);
    const equipesAtualizadas = equipes.filter(e => e.id !== editingId);
    localStorage.setItem('equipes', JSON.stringify(equipesAtualizadas));
    setEquipes(equipesAtualizadas);
    if (equipeRemovida) {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        try {
          const currentUser = JSON.parse(rawUser) as { email?: string };
          const currentIdentifier = String(currentUser.email ?? '').toLowerCase();
          const removedEmail = String(equipeRemovida.email ?? '').toLowerCase();
          const removedLogin = String(equipeRemovida.login ?? '').toLowerCase();
          if (currentIdentifier && (currentIdentifier === removedEmail || currentIdentifier === removedLogin)) {
            localStorage.removeItem('user');
          }
        } catch {}
      }
    }
    setIsModalOpen(false);
    resetForm();
  };

  const obterLabelParceiro = (parceiroId: string): string => {
    const parceiro = parceiros.find(p => p.id === parceiroId);
    return parceiro ? parceiro.nome : parceiroId;
  };

  const obterLabelFuncao = (funcaoValue: string): string => {
    const funcao = funcoes.find(f => f.value === funcaoValue);
    return funcao ? funcao.label : funcaoValue;
  };

  const filteredEquipes = equipes.filter(equipe => {
    const term = searchTerm.toLowerCase();
    const parceiroNome = obterLabelParceiro(equipe.parceiro).toLowerCase();
    const funcaoLabel = obterLabelFuncao(equipe.funcao).toLowerCase();
    
    return (
      equipe.login.toLowerCase().includes(term) ||
      equipe.cpf.includes(term) ||
      parceiroNome.includes(term) ||
      funcaoLabel.includes(term)
    );
  });

  const groupedEquipes = filteredEquipes.reduce<Record<string, Equipe[]>>((acc, equipe) => {
    const key = equipe.parceiro || 'sem_parceiro';
    if (!acc[key]) acc[key] = [];
    acc[key].push(equipe);
    return acc;
  }, {});
  const partnerIds = Object.keys(groupedEquipes);

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
              Cadastro de Equipes
            </h1>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Gerencie os membros das equipes vinculados aos parceiros
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

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Parceiro
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Login
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
              const parceiroLabel = parceiroId === 'sem_parceiro' ? 'Sem parceiro' : obterLabelParceiro(parceiroId);
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
                          {membros.length} membro(s)
                        </span>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && membros.map((equipe) => (
                    <tr key={equipe.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                        {obterLabelParceiro(equipe.parceiro)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                        {equipe.login}
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
                        <Button onClick={() => handleEdit(equipe)} size="sm" variant="secondary">
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

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
        >
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-6">
                {editingId ? 'Editar Cadastro' : 'Novo Cadastro'}
              </h2>

              {/* Informações Básicas */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-4">
                  Informações Básicas
                </h3>
                <div className="space-y-4">
                  <Select
                    label="Parceiro *"
                    value={formData.parceiro}
                    onChange={(value) => handleChange('parceiro', value)}
                    options={parceiroOptions}
                    error={errors.parceiro}
                  />
                  <Input
                    label="E-mail *"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    error={errors.email}
                  />
                  <Input
                    label="Login *"
                    value={formData.login}
                    onChange={(e) => handleChange('login', e.target.value)}
                    error={errors.login}
                  />
                  <Input
                    label="Senha *"
                    type="password"
                    value={formData.senha || ''}
                    onChange={(e) => handleChange('senha', e.target.value)}
                    error={errors.senha}
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

