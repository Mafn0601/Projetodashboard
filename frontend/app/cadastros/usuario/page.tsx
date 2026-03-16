'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { parceiroServiceAPI } from '@/services/parceiroServiceAPI';
import { usuarioServiceAPI, UsuarioRole } from '@/services/usuarioServiceAPI';

type UsuarioForm = {
  parceiroId: string;
  email: string;
  login: string;
  senha: string;
  role: UsuarioRole;
};

type UsuarioListItem = {
  id: string;
  parceiroNome: string;
  email: string;
  login: string;
  role: UsuarioRole;
  ativo: boolean;
};

const roleOptions: SelectOption[] = [
  { value: 'ADMIN', label: 'ADMIN' },
  { value: 'DONO', label: 'DONO' },
  { value: 'FINANCEIRO', label: 'FINANCEIRO' },
  { value: 'GERENTE', label: 'GERENTE' },
  { value: 'OPERADOR', label: 'OPERADOR' },
  { value: 'PARCEIRO', label: 'PARCEIRO' },
];

const initialForm: UsuarioForm = {
  parceiroId: '',
  email: '',
  login: '',
  senha: '',
  role: 'OPERADOR',
};

function normalizeText(value: string) {
  return value.trim();
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
      const [parceiros, usuariosApi] = await Promise.all([
        parceiroServiceAPI.findAll({ preferCache: true, forceRefresh: true }),
        usuarioServiceAPI.findAll(),
      ]);

      const options = parceiros.map((p) => ({ value: p.id, label: p.nome }));
      setConcessionarias(options);

      const list: UsuarioListItem[] = usuariosApi.map((usuario) => ({
        id: usuario.id,
        parceiroNome: parceiros.find((p) => p.id === usuario.parceiroId)?.nome || usuario.parceiro?.nome || '-',
        email: usuario.email,
        login: usuario.login,
        role: usuario.role,
        ativo: usuario.ativo,
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
    if (!normalizeText(form.role)) nextErrors.role = 'Campo obrigatório';

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
      await usuarioServiceAPI.create({
        nome: normalizeText(form.login),
        parceiroId: normalizeText(form.parceiroId),
        email: normalizeText(form.email).toLowerCase(),
        login: normalizeText(form.login).toLowerCase(),
        senha: form.senha,
        role: form.role,
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
                    <th className="px-3 py-2 font-medium">E-mail</th>
                    <th className="px-3 py-2 font-medium">Login</th>
                    <th className="px-3 py-2 font-medium">Perfil</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-t border-slate-200 odd:bg-slate-50 even:bg-slate-100 dark:border-slate-800 dark:odd:bg-slate-950/60 dark:even:bg-slate-900/40">
                      <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{usuario.parceiroNome}</td>
                      <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{usuario.email}</td>
                      <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{usuario.login}</td>
                      <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{usuario.role}</td>
                      <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{usuario.ativo ? 'Ativo' : 'Inativo'}</td>
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
            <Select
              label="Perfil"
              value={form.role}
              onChange={(value) => handleChange('role', value as UsuarioRole)}
              options={roleOptions}
              placeholder="Selecione..."
              required
              error={errors.role}
              forceAbove={false}
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

