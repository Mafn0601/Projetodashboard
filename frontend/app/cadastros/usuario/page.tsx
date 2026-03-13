'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { MaskedInput, applyCpfCnpjMask, applyPhoneMask } from '@/components/ui/MaskedInput';
import { parceiroServiceAPI } from '@/services/parceiroServiceAPI';
import { equipeServiceAPI } from '@/services/equipeServiceAPI';

type UsuarioForm = {
  parceiroId: string;
  email: string;
  login: string;
  senha: string;
  cpf: string;
  funcao: string;
  telefone: string;
  estado: string;
};

type UsuarioListItem = {
  id: string;
  parceiroNome: string;
  cpf: string;
  email: string;
  login: string;
  funcao: string;
  telefone: string;
  estado: string;
};

const funcoesOptions: SelectOption[] = [
  { value: 'admin', label: 'ADMIN' },
  { value: 'consultor_vendas', label: 'Consultor de Vendas' },
  { value: 'gerente_vendas', label: 'Gerente de Vendas' },
  { value: 'gerente_comercial', label: 'Gerente Comercial' },
  { value: 'operador', label: 'Operador' },
  { value: 'auxiliar_administrativo', label: 'Auxiliar Administrativo' },
  { value: 'tecnico', label: 'Técnico' },
];

const estadosBrasil: SelectOption[] = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];

const initialForm: UsuarioForm = {
  parceiroId: '',
  email: '',
  login: '',
  senha: '',
  cpf: '',
  funcao: '',
  telefone: '',
  estado: '',
};

function normalizeText(value: string) {
  return value.trim();
}

function normalizeDigits(value: string) {
  return value.replace(/\D/g, '');
}

function formatCpf(value: string) {
  const digits = normalizeDigits(value).slice(0, 11);
  if (!digits) return '-';
  return applyCpfCnpjMask(digits);
}

function formatPhone(value: string) {
  const digits = normalizeDigits(value).slice(0, 11);
  if (!digits) return '-';
  return applyPhoneMask(digits);
}

export default function Page() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<UsuarioForm>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<UsuarioListItem[]>([]);
  const [concessionarias, setConcessionarias] = useState<SelectOption[]>([]);

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      const [parceiros, equipes] = await Promise.all([
        parceiroServiceAPI.findAll({ preferCache: true, forceRefresh: true }),
        equipeServiceAPI.findAll(undefined, undefined, { preferCache: true, forceRefresh: true }),
      ]);

      const options = parceiros.map((p) => ({ value: p.id, label: p.nome }));
      setConcessionarias(options);

      const list: UsuarioListItem[] = equipes.map((eq) => ({
        id: eq.id,
        parceiroNome: parceiros.find((p) => p.id === eq.parceiroId)?.nome || eq.parceiro?.nome || '-',
        cpf: eq.cpf || '-',
        email: eq.email || '-',
        login: eq.login,
        funcao: eq.funcao,
        telefone: eq.telefone || '-',
        estado: eq.estado || '-',
      }));
      setUsuarios(list);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void carregarDados();
  }, []);

  const handleChange = <K extends keyof UsuarioForm>(field: K, value: UsuarioForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!normalizeText(form.parceiroId)) nextErrors.parceiroId = 'Campo obrigatório';
    if (!normalizeText(form.email)) nextErrors.email = 'Campo obrigatório';
    if (!normalizeText(form.login)) nextErrors.login = 'Campo obrigatório';
    if (!normalizeText(form.senha)) nextErrors.senha = 'Campo obrigatório';
    if (!normalizeText(form.funcao)) nextErrors.funcao = 'Campo obrigatório';

    const cpf = normalizeDigits(form.cpf);
    if (!cpf) nextErrors.cpf = 'Campo obrigatório';
    else if (cpf.length !== 11) nextErrors.cpf = 'CPF deve ter 11 dígitos';

    if (normalizeText(form.senha) && normalizeText(form.senha).length < 6) {
      nextErrors.senha = 'Senha deve ter no mínimo 6 caracteres';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await equipeServiceAPI.create({
        parceiroId: normalizeText(form.parceiroId),
        email: normalizeText(form.email).toLowerCase(),
        cpf: normalizeDigits(form.cpf),
        funcao: normalizeText(form.funcao),
        telefone: normalizeDigits(form.telefone),
        estado: normalizeText(form.estado) || undefined,
        comissaoAtiva: false,
        ativo: true,
      });

      setIsModalOpen(false);
      setForm(initialForm);
      setErrors({});
      setShowPassword(false);
      await carregarDados();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Erro ao cadastrar usuário');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Cadastro de Usuários</h1>
          <p className="text-xs text-slate-700 dark:text-slate-400">
            Controle de acesso separado da gestão de equipe.
          </p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          + Novo Usuário
        </Button>
      </header>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4">
        <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-50">Usuários Cadastrados</h2>
        {isLoading ? (
          <p className="text-xs text-slate-700 dark:text-slate-300">Carregando...</p>
        ) : usuarios.length === 0 ? (
          <p className="text-xs text-slate-700 dark:text-slate-300">Nenhum usuário cadastrado.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="scrollbar-thin max-h-96 overflow-auto overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <tr>
                    <th className="px-3 py-2 font-medium">Concessionária</th>
                    <th className="px-3 py-2 font-medium">CPF</th>
                    <th className="px-3 py-2 font-medium">E-mail</th>
                    <th className="px-3 py-2 font-medium">Login</th>
                    <th className="px-3 py-2 font-medium">Função</th>
                    <th className="px-3 py-2 font-medium">Telefone</th>
                    <th className="px-3 py-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-t border-slate-200 odd:bg-slate-50 even:bg-slate-100 dark:border-slate-800 dark:odd:bg-slate-950/60 dark:even:bg-slate-900/40">
                      <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{usuario.parceiroNome}</td>
                      <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{formatCpf(usuario.cpf)}</td>
                      <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{usuario.email}</td>
                      <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{usuario.login}</td>
                      <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{usuario.funcao}</td>
                      <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{formatPhone(usuario.telefone)}</td>
                      <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{usuario.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <Modal
        open={isModalOpen}
        onClose={() => {
          if (isSubmitting) return;
          setIsModalOpen(false);
          setForm(initialForm);
          setErrors({});
          setSubmitError(null);
          setShowPassword(false);
        }}
        title="Novo Usuário"
        description="Informações Básicas"
        className="max-w-3xl"
        showFooter={false}
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Concessionária"
              value={form.parceiroId}
              onChange={(value) => handleChange('parceiroId', value)}
              options={concessionarias}
              placeholder="Selecione..."
              required
              error={errors.parceiroId}
              forceAbove={false}
            />
            <Input
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(event) => handleChange('email', event.target.value)}
              required
              error={errors.email}
            />
            <Input
              label="Login"
              value={form.login}
              onChange={(event) => handleChange('login', event.target.value)}
              required
              error={errors.login}
            />
            <Input
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              value={form.senha}
              onChange={(event) => handleChange('senha', event.target.value)}
              required
              error={errors.senha}
            />
            <MaskedInput
              label="CPF"
              mask="cpfCnpj"
              value={form.cpf}
              onChange={(value) => handleChange('cpf', value)}
              required
              error={errors.cpf}
            />
            <Select
              label="Função"
              value={form.funcao}
              onChange={(value) => handleChange('funcao', value)}
              options={funcoesOptions}
              placeholder="Selecione..."
              required
              error={errors.funcao}
              forceAbove={false}
            />
            <MaskedInput
              label="Telefone"
              mask="phone"
              value={form.telefone}
              onChange={(value) => handleChange('telefone', value)}
              error={errors.telefone}
            />
            <Select
              label="Estado"
              value={form.estado}
              onChange={(value) => handleChange('estado', value)}
              options={estadosBrasil}
              placeholder="Selecione..."
              error={errors.estado}
              forceAbove={true}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
            />
            Visualizar senha digitada
          </label>

          {submitError && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              {submitError}
            </p>
          )}

          <p className="text-xs text-slate-600 dark:text-slate-400">Campos marcados com * são obrigatórios.</p>

          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                if (isSubmitting) return;
                setIsModalOpen(false);
                setForm(initialForm);
                setErrors({});
                setSubmitError(null);
                setShowPassword(false);
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Usuário'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

