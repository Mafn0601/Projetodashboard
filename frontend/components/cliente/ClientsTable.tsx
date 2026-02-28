"use client";
import React from 'react';
import { Client } from '@/lib/mockClients';

type Props = {
  clients: Client[];
  onEdit: (client: Client) => void;
};

export default function ClientsTable({ clients, onEdit }: Props) {
  return (
    <div className="mt-4 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl overflow-auto shadow-lg">
      <table className="min-w-full divide-y divide-slate-200 text-base">
        <thead className="bg-blue-600">
          <tr>
            <th className="px-6 py-4 text-left font-bold text-white">Nome</th>
            <th className="px-6 py-4 text-left font-bold text-white">CPF/CNPJ</th>
            <th className="px-6 py-4 text-left font-bold text-white">Email</th>
            <th className="px-6 py-4 text-left font-bold text-white">Telefone</th>
            <th className="px-6 py-4 text-left font-bold text-white">Cidade</th>
            <th className="px-6 py-4 text-left font-bold text-white">UF</th>
            <th className="px-6 py-4 text-left font-bold text-white">Status</th>
            <th className="px-6 py-4 text-left font-bold text-white">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {clients.map((client) => (
            <tr key={client.id} className="hover:bg-blue-50 transition-colors">
              <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-semibold">{client.nome}</td>
              <td className="px-6 py-4 text-slate-800 dark:text-slate-200">{client.cpfCnpj}</td>
              <td className="px-6 py-4 text-slate-800 dark:text-slate-200">{client.email}</td>
              <td className="px-6 py-4 text-slate-800 dark:text-slate-200">{client.telefone}</td>
              <td className="px-6 py-4 text-slate-800 dark:text-slate-200">{client.cidade}</td>
              <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-semibold">{client.uf}</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-2 rounded-lg text-sm font-bold ${client.status === 'Ativo' ? 'bg-green-200 text-green-900' : 'bg-yellow-200 text-yellow-900'}`}>
                  {client.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <button onClick={() => onEdit(client)} className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors text-base">
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
