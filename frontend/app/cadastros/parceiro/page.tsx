'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CrudTemplate from "@/components/templates/crud-template";
import { parceiroServiceAPI } from '@/services/parceiroServiceAPI';

// Opções de Status
const statusOptions = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" }
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

export default function Page() {
  const router = useRouter();
  const [crudVersion, setCrudVersion] = useState(0);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    let mounted = true;

    const hydrateParceirosLocalStorage = async () => {
      try {
        const localRaw = typeof window !== 'undefined' ? localStorage.getItem('parceiros') : null;
        const localParceiros = localRaw ? JSON.parse(localRaw) : [];

        const temIdLegado = Array.isArray(localParceiros)
          ? localParceiros.some((p: { id?: unknown }) => String(p?.id || '').startsWith('parceiros_'))
          : false;

        if (Array.isArray(localParceiros) && localParceiros.length > 0 && !temIdLegado) {
          return;
        }

        const parceirosAPI = await parceiroServiceAPI.findAll({ preferCache: true, forceRefresh: true });
        if (!Array.isArray(parceirosAPI) || parceirosAPI.length === 0) {
          return;
        }

        const parceirosParaCrud = parceirosAPI.map((p) => {
          const enderecoPartes = String(p.endereco || '').split(' - ').map((parte) => parte.trim());
          const grupo = enderecoPartes[0] || '';
          const cidade = enderecoPartes[1] || '';
          const estado = enderecoPartes[2] || '';

          return {
            id: p.id,
            cnpj: p.cnpj || '',
            nome: p.nome || '',
            telefone: p.telefone || '',
            email: p.email || '',
            grupo,
            cidade,
            estado,
            status: p.ativo ? 'ativo' : 'inativo',
            cep: p.cep || '',
            rua: p.rua || '',
            numero: p.numero || '',
            complemento: p.complemento || '',
            bairro: p.bairro || '',
          };
        });

        localStorage.setItem('parceiros', JSON.stringify(parceirosParaCrud));
        if (mounted) {
          setCrudVersion((prev) => prev + 1);
        }
      } catch (error) {
        console.error('Erro ao sincronizar parceiros para localStorage:', error);
      } finally {
        if (mounted) {
          setIsHydrating(false);
        }
      }
    };

    hydrateParceirosLocalStorage();

    return () => {
      mounted = false;
    };
  }, []);

  const handleBeforeCreateParceiro = async (entity: { [key: string]: unknown }) => {
    const nome = String(entity.nome || '').trim();
    const grupo = String(entity.grupo || '').trim();
    const cidade = String(entity.cidade || '').trim();
    const estado = String(entity.estado || '').trim();
    const status = String(entity.status || 'ativo').trim().toLowerCase();
    
    // Limpar CNPJ e CEP removendo caracteres não numéricos antes de salvar
    const cnpjLimpo = String(entity.cnpj || '').replace(/\D/g, '').trim();
    const cepLimpo = String(entity.cep || '').replace(/\D/g, '').trim();

    const endereco = [grupo, cidade, estado].filter(Boolean).join(' - ');

    const parceiroCriado = await parceiroServiceAPI.create({
      nome,
      cnpj: cnpjLimpo || undefined,
      telefone: String(entity.telefone || '').trim() || undefined,
      email: String(entity.email || '').trim() || undefined,
      endereco: endereco || undefined,
      cep: cepLimpo || undefined,
      rua: String(entity.rua || '').trim() || undefined,
      numero: String(entity.numero || '').trim() || undefined,
      complemento: String(entity.complemento || '').trim() || undefined,
      bairro: String(entity.bairro || '').trim() || undefined,
      ativo: status !== 'inativo',
    });

    if (!parceiroCriado?.id) {
      throw new Error('Falha ao criar parceiro no Supabase');
    }

    return {
      id: parceiroCriado.id,
      cnpj: parceiroCriado.cnpj || '',
      nome: parceiroCriado.nome || nome,
      telefone: parceiroCriado.telefone || '',
      email: parceiroCriado.email || '',
      grupo,
      cidade,
      estado,
      status: parceiroCriado.ativo ? 'ativo' : 'inativo',
      cep: parceiroCriado.cep || '',
      rua: parceiroCriado.rua || '',
      numero: parceiroCriado.numero || '',
      complemento: parceiroCriado.complemento || '',
      bairro: parceiroCriado.bairro || '',
    };
  };

  const handleBeforeUpdateParceiro = async (id: string, entity: { [key: string]: unknown }) => {
    const nome = String(entity.nome || '').trim();
    const grupo = String(entity.grupo || '').trim();
    const cidade = String(entity.cidade || '').trim();
    const estado = String(entity.estado || '').trim();
    const status = String(entity.status || 'ativo').trim().toLowerCase();
    const cnpjLimpo = String(entity.cnpj || '').replace(/\D/g, '').trim();
    const cepLimpo = String(entity.cep || '').replace(/\D/g, '').trim();
    const endereco = [grupo, cidade, estado].filter(Boolean).join(' - ');

    const parceiroAtualizado = await parceiroServiceAPI.update(id, {
      nome,
      cnpj: cnpjLimpo || undefined,
      telefone: String(entity.telefone || '').trim() || undefined,
      email: String(entity.email || '').trim() || undefined,
      endereco: endereco || undefined,
      cep: cepLimpo || undefined,
      rua: String(entity.rua || '').trim() || undefined,
      numero: String(entity.numero || '').trim() || undefined,
      complemento: String(entity.complemento || '').trim() || undefined,
      bairro: String(entity.bairro || '').trim() || undefined,
      ativo: status !== 'inativo',
    });

    return {
      id: parceiroAtualizado.id,
      cnpj: parceiroAtualizado.cnpj || '',
      nome: parceiroAtualizado.nome || nome,
      telefone: parceiroAtualizado.telefone || '',
      email: parceiroAtualizado.email || '',
      grupo,
      cidade,
      estado,
      status: parceiroAtualizado.ativo ? 'ativo' : 'inativo',
      cep: parceiroAtualizado.cep || '',
      rua: parceiroAtualizado.rua || '',
      numero: parceiroAtualizado.numero || '',
      complemento: parceiroAtualizado.complemento || '',
      bairro: parceiroAtualizado.bairro || '',
    };
  };

  const handleBeforeDeleteParceiro = async (id: string) => {
    await parceiroServiceAPI.delete(id);
  };

  const handleRowClick = (item: { id: string; nome?: unknown; [key: string]: unknown }) => {
    const nomeParceiro = item.nome as string || 'parceiro';
    const slug = nomeParceiro.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    router.push(`/cadastros/parceiro/${item.id}?nome=${encodeURIComponent(nomeParceiro)}`);
  };

  return (
    isHydrating ? (
      <div className="space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Cadastro de Concessionarias</h1>
            <p className="text-xs text-slate-700 dark:text-slate-400">Sincronizando dados...</p>
          </div>
        </header>
      </div>
    ) : (
    <CrudTemplate
      key={crudVersion}
      title="Cadastro de Concessionarias"
      entityKey="parceiros"
      useModal={true}
      createModalMaxHeightClass="max-h-[94vh]"
      onBeforeCreate={handleBeforeCreateParceiro}
      onBeforeUpdate={handleBeforeUpdateParceiro}
      onBeforeDelete={handleBeforeDeleteParceiro}
      enableRowClick={true}
      onRowClick={handleRowClick}
      fields={[
        { name: "cnpj", label: "CNPJ", type: "masked", mask: "cpfCnpj" },
        { name: "nome", label: "Nome da Concessionaria" },
        { name: "telefone", label: "Telefone", required: false },
        { name: "email", label: "E-mail", required: false },
        { name: "grupo", label: "Grupo", required: false },
        { name: "cidade", label: "Cidade" },
        { name: "estado", label: "Estado", type: "select", options: estadosBrasil, forceAboveInCreate: true },
        { 
          name: "status", 
          label: "Status", 
          type: "select", 
          options: statusOptions,
          forceAboveInCreate: true
        },
        { name: "cep", label: "CEP", type: "masked", mask: "cep", hideInList: true },
        { name: "rua", label: "Rua", hideInList: true },
        { name: "numero", label: "Número", hideInList: true },
        { name: "complemento", label: "Complemento", hideInList: true, required: false },
        { name: "bairro", label: "Bairro", hideInList: true }
      ]}
    />
    )
  );
}

