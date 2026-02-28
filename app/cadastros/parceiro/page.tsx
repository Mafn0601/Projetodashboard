'use client';

import { useRouter } from 'next/navigation';
import CrudTemplate from "@/components/templates/crud-template";

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

  const handleRowClick = (item: { id: string; nome?: unknown; [key: string]: unknown }) => {
    const nomeParceiro = item.nome as string || 'parceiro';
    const slug = nomeParceiro.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    router.push(`/cadastros/parceiro/${item.id}?nome=${encodeURIComponent(nomeParceiro)}`);
  };

  return (
    <CrudTemplate
      title="Cadastro de Parceiros"
      entityKey="parceiros"
      useModal={true}
      enableRowClick={true}
      onRowClick={handleRowClick}
      fields={[
        { name: "cnpj", label: "CNPJ", type: "masked", mask: "cpfCnpj" },
        { name: "nome", label: "Nome da Empresa" },
        { name: "grupo", label: "Grupo", required: false },
        { name: "cidade", label: "Cidade" },
        { name: "estado", label: "Estado", type: "select", options: estadosBrasil },
        { 
          name: "status", 
          label: "Status", 
          type: "select", 
          options: statusOptions
        }
      ]}
    />
  );
}

