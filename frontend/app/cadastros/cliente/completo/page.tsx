'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import ClienteModalCompleto from '@/components/cliente/ClienteModalCompleto';
import * as clienteService from '@/services/clienteService';

function formatarDataAgendamento(data: string | undefined): string {
  if (!data) return '-';
  const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(data);
  if (dateOnlyMatch) {
    const [year, month, day] = data.split('-');
    return `${day}/${month}/${year}`;
  }
  const parsed = new Date(data);
  if (isNaN(parsed.getTime())) return data;
  return parsed.toLocaleDateString('pt-BR');
}

export default function ClienteCompletoPage() {
  const [clientes, setClientes] = useState<clienteService.ClienteCompleto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<clienteService.ClienteCompleto | undefined>();

  // Carregar clientes ao montar
  useEffect(() => {
    const all = clienteService.getAllCompleto();
    setClientes(all);
  }, []);

  const handleSaved = (cliente: clienteService.ClienteCompleto) => {
    const all = clienteService.getAllCompleto();
    setClientes(all);
    setEditingCliente(undefined);
  };

  const handleEdit = (cliente: clienteService.ClienteCompleto) => {
    setEditingCliente(cliente);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja deletar este cliente?')) {
      const remaining = clienteService.removeCompleto(id);
      setClientes(remaining);
    }
  };

  const handleOpenModal = () => {
    setEditingCliente(undefined);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCliente(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Cadastro de Clientes (Completo)</h1>
          <p className="text-xs text-slate-700 dark:text-slate-400">
            Gerencie seus clientes com formulário detalhado.
          </p>
        </div>
        <Button
          onClick={handleOpenModal}
          variant="primary"
          size="sm"
        >
          + Novo
        </Button>
      </header>

      {/* Modal */}
      <ClienteModalCompleto
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSaved={handleSaved}
        initial={editingCliente}
      />

      {/* Lista de Clientes */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4">
        <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
          Clientes Cadastrados ({clientes.length})
        </h2>

        {clientes.length === 0 ? (
          <p className="text-xs text-slate-700 py-8 text-center">
            Nenhum cliente cadastrado. Clique em "+ Novo" para começar.
          </p>
        ) : (
          <div className="space-y-3">
            {clientes.map((cliente) => (
              <div
                key={cliente.id}
                className="bg-white dark:bg-slate-900/60 rounded-lg p-4 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Coluna Esquerda */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-slate-700 dark:text-slate-400">Nome:</span>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{cliente.nome}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-700 dark:text-slate-400">Telefone:</span>
                      <p className="text-sm text-slate-900 dark:text-slate-100">{cliente.telefone}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-700 dark:text-slate-400">Placa:</span>
                      <p className="text-sm font-mono text-slate-900 dark:text-slate-100">{cliente.placa}</p>
                    </div>
                    {cliente.email && (
                      <div>
                        <span className="text-xs text-slate-700 dark:text-slate-400">Email:</span>
                        <p className="text-sm text-slate-900 dark:text-slate-100">{cliente.email}</p>
                      </div>
                    )}
                  </div>

                  {/* Coluna Direita */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-slate-700 dark:text-slate-400">Veículo:</span>
                      <p className="text-sm text-slate-900 dark:text-slate-100">
                        {cliente.modelo} ({cliente.fabricante})
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-700 dark:text-slate-400">Agendamento:</span>
                      <p className="text-sm text-slate-900 dark:text-slate-100">
                        {formatarDataAgendamento(cliente.dataAgendamento)}
                        {cliente.horarioAgendamento && ` às ${cliente.horarioAgendamento}`}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-700 dark:text-slate-400">Tipo:</span>
                      <p className="text-sm text-slate-900 dark:text-slate-100">{cliente.tipoAgendamento}</p>
                    </div>
                    {cliente.nomeCliente && (
                      <div>
                        <span className="text-xs text-slate-700 dark:text-slate-400">Nome do Cliente:</span>
                        <p className="text-sm text-slate-900 dark:text-slate-100">{cliente.nomeCliente}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Descrição */}
                {cliente.descricaoServico && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-700 dark:text-slate-400">Descrição:</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">{cliente.descricaoServico}</p>
                  </div>
                )}

                {/* Ações */}
                <div className="flex gap-2 mt-4 justify-end">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEdit(cliente)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(cliente.id)}
                  >
                    Deletar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
