export type Client = {
  id: string;
  nome: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  cidade: string;
  uf: string;
  status: string;
};

const MOCK_CLIENTS: Client[] = [
  { id: '1', nome: 'João Silva', cpfCnpj: '123.456.789-00', email: 'joao@email.com', telefone: '(11) 99999-9999', cidade: 'São Paulo', uf: 'SP', status: 'Ativo' },
  { id: '2', nome: 'Maria Oliveira', cpfCnpj: '987.654.321-00', email: 'maria@email.com', telefone: '(21) 88888-8888', cidade: 'Rio de Janeiro', uf: 'RJ', status: 'Ativo' },
  { id: '3', nome: 'Empresa XYZ', cpfCnpj: '12.345.678/0001-90', email: 'contato@xyz.com', telefone: '(31) 3333-3333', cidade: 'Belo Horizonte', uf: 'MG', status: 'Inativo' },
];

export async function getClients(searchParams: Record<string, string | string[] | undefined>): Promise<Client[]> {
  // Simula delay de rede
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  let filtered = [...MOCK_CLIENTS];

  const nome = searchParams?.nome as string;
  if (nome) {
    filtered = filtered.filter((c) => c.nome.toLowerCase().includes(nome.toLowerCase()));
  }

  const cpf = searchParams?.cpf as string;
  if (cpf) {
    filtered = filtered.filter((c) => c.cpfCnpj.includes(cpf));
  }

  const cidade = searchParams?.cidade as string;
  if (cidade) {
    filtered = filtered.filter((c) => c.cidade.toLowerCase().includes(cidade.toLowerCase()));
  }

  return filtered;
}