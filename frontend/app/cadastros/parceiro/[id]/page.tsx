'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { parceiroServiceAPI, ParceiroAPI } from '@/services/parceiroServiceAPI';
import { equipeServiceAPI, EquipeAPI } from '@/services/equipeServiceAPI';
import { ordemServicoServiceAPI, OrdemServico } from '@/services/ordemServicoServiceAPI';
import { orcamentoServiceAPI, OrcamentoAPI } from '@/services/orcamentoServiceAPI';
import { agendamentoServiceAPI, Agendamento } from '@/services/agendamentoServiceAPI';

type AtividadeRecente = {
  id: string;
  titulo: string;
  detalhe: string;
  data: string;
};

function formatDateTime(value?: string): string {
  if (!value) return '-';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleString('pt-BR');
}

function formatAddress(parceiro: ParceiroAPI | null): string {
  if (!parceiro) return '-';
  const partes = [
    parceiro.rua,
    parceiro.numero,
    parceiro.complemento,
    parceiro.bairro,
    parceiro.cep,
  ]
    .map((parte) => String(parte || '').trim())
    .filter(Boolean);

  if (parceiro.endereco) {
    const enderecoBruto = String(parceiro.endereco).trim();
    return [enderecoBruto, ...partes].filter(Boolean).join(' - ');
  }

  return partes.length ? partes.join(', ') : '-';
}

export default function ParceiroDetalhePage() {
  const params = useParams();
  const router = useRouter();

  const [parceiro, setParceiro] = useState<ParceiroAPI | null>(null);
  const [equipes, setEquipes] = useState<EquipeAPI[]>([]);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [orcamentos, setOrcamentos] = useState<OrcamentoAPI[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  const id = params.id as string;

  useEffect(() => {
    let mounted = true;

    const carregarDetalhes = async () => {
      try {
        setLoading(true);

        const [parceiroData, equipesData, ordensData, orcamentosData, agendamentosData] = await Promise.all([
          parceiroServiceAPI.findById(id),
          equipeServiceAPI.findAll(id, undefined, { preferCache: false, forceRefresh: true }),
          ordemServicoServiceAPI.findAll({ take: 200 }),
          orcamentoServiceAPI.findAll({ status: 'PENDENTE', take: 200 }),
          agendamentoServiceAPI.findAll({ take: 200 }),
        ]);

        if (!mounted) return;

        setParceiro(parceiroData);
        setEquipes(equipesData || []);
        setOrdens((ordensData || []).filter((os) => os.parceiroId === id));
        setOrcamentos(
          (orcamentosData || []).filter((orc) =>
            String(orc.observacoes || '').includes(`PARCEIRO_ID:${id}`)
          )
        );
        setAgendamentos((agendamentosData || []).filter((item) => item.parceiroId === id));
      } catch (error) {
        console.error('Erro ao carregar detalhes do parceiro:', error);
        if (mounted) {
          setParceiro(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    carregarDetalhes();

    return () => {
      mounted = false;
    };
  }, [id]);

  const osEmAndamento = useMemo(
    () => ordens.filter((os) => !['CONCLUIDO', 'ENTREGUE'].includes(os.status)).length,
    [ordens]
  );

  const atividadesRecentes = useMemo<AtividadeRecente[]>(() => {
    const atividadesOS = ordens.map((os) => ({
      id: `os-${os.id}`,
      titulo: `OS ${os.numeroOS}`,
      detalhe: `Status: ${os.status}`,
      data: os.updatedAt,
    }));

    const atividadesAgendamento = agendamentos.map((ag) => ({
      id: `ag-${ag.id}`,
      titulo: 'Agendamento',
      detalhe: `${ag.tipoAgendamento} - ${ag.status}`,
      data: ag.updatedAt,
    }));

    return [...atividadesOS, ...atividadesAgendamento]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 8);
  }, [ordens, agendamentos]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-700 dark:text-slate-400">Carregando...</div>
      </div>
    );
  }

  if (!parceiro) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            ← Voltar
          </Button>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Parceiro não encontrado
          </h1>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-slate-700 dark:text-slate-400">
            O parceiro solicitado não foi encontrado no sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            ← Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {parceiro.nome}
            </h1>
            <p className="text-sm text-slate-700 dark:text-slate-400">Detalhes do parceiro</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
          Informações do Parceiro
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">CNPJ</p>
            <p className="text-base text-slate-900 dark:text-slate-100">{parceiro.cnpj || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Email</p>
            <p className="text-base text-slate-900 dark:text-slate-100">{parceiro.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Telefone</p>
            <p className="text-base text-slate-900 dark:text-slate-100">{parceiro.telefone || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Status</p>
            <span
              className={`inline-block px-3 py-1 text-sm font-semibold rounded-lg ${
                parceiro.ativo
                  ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-800'
                  : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-800'
              }`}
            >
              {parceiro.ativo ? 'ativo' : 'inativo'}
            </span>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Endereço completo</p>
            <p className="text-base text-slate-900 dark:text-slate-100">{formatAddress(parceiro)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-400 mb-2">Funcionários vinculados</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{equipes.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-400 mb-2">Orçamentos ativos</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{orcamentos.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-400 mb-2">OS em andamento</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{osEmAndamento}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-400 mb-2">Agendamentos vinculados</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{agendamentos.length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Atividades Recentes</h2>
        {atividadesRecentes.length === 0 ? (
          <div className="text-center py-8 text-slate-700 dark:text-slate-400">Nenhuma atividade registrada</div>
        ) : (
          <div className="space-y-3">
            {atividadesRecentes.map((atividade) => (
              <div
                key={atividade.id}
                className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-900/40"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{atividade.titulo}</p>
                <p className="text-xs text-slate-700 dark:text-slate-400">{atividade.detalhe}</p>
                <p className="text-xs text-slate-700 dark:text-slate-500 mt-1">{formatDateTime(atividade.data)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
