"use client";
import React, { useState } from 'react';
import ClientsTable from './components/cliente/ClientsTable';
import ClienteVeiculoModal from './ClienteVeiculoModal';
import { Client } from '@/lib/mockClients';
import { Card } from './components/ui/Card';
import { HelpBox } from './components/ui/HelpBox';

type Props = {
  initialClients: Client[];
};

export default function ClientList({ initialClients }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);

  function handleNew() {
    setEditingClient(undefined); // Limpa para novo cadastro
    setModalOpen(true);
  }

  function handleEdit(client: Client) {
    setEditingClient(client); // Define cliente para edição
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <HelpBox 
        title="Como usar:"
        message="Clique em 'Novo Cliente' para adicionar um novo cliente, ou clique em 'Editar' para modificar um cliente existente. Use a tabela para visualizar todos os clientes cadastrados."
        variant="info"
      />

      <Card>
        <div className="flex justify-between items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Clientes</h2>
            <p className="text-lg text-slate-600 mt-2">Gerenciamento de clientes cadastrados</p>
          </div>
          <button onClick={handleNew} className="bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 flex items-center gap-3 font-bold text-lg transition-colors shadow-lg whitespace-nowrap">
            <i className="fa fa-plus text-xl" /> Novo Cliente
          </button>
        </div>

        <div className="mt-8">
          <ClientsTable clients={initialClients} onEdit={handleEdit} />
        </div>
      </Card>

      <ClienteVeiculoModal 
        open={modalOpen} 
        setOpen={setModalOpen} 
        initialCliente={editingClient}
      />
    </div>
  );
}