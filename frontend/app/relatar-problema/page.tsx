'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle, CheckCircle2, Send } from 'lucide-react';

export default function RelatarProblemaPage() {
  const [formData, setFormData] = useState({
    assunto: '',
    descricao: '',
    email: '',
    urgencia: 'media',
  });
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    // Simular envio (aqui você pode integrar com API/email)
    await new Promise(resolve => setTimeout(resolve, 1500));

    setEnviado(true);
    setEnviando(false);

    // Reset após 3 segundos
    setTimeout(() => {
      setEnviado(false);
      setFormData({
        assunto: '',
        descricao: '',
        email: '',
        urgencia: 'media',
      });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (enviado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4">
              <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            Problema Relatado!
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Recebemos seu relato e nossa equipe irá analisar em breve. Obrigado pelo feedback!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full p-3">
            <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Relatar um Problema
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Descreva o problema encontrado para que possamos melhorar o sistema
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email para Contato
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="seu@email.com"
            />
          </div>

          {/* Assunto */}
          <div>
            <label htmlFor="assunto" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Assunto
            </label>
            <Input
              id="assunto"
              name="assunto"
              value={formData.assunto}
              onChange={handleChange}
              required
              placeholder="Ex: Erro ao salvar cliente"
            />
          </div>

          {/* Urgência */}
          <div>
            <label htmlFor="urgencia" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Urgência
            </label>
            <select
              id="urgencia"
              name="urgencia"
              value={formData.urgencia}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="baixa">🟢 Baixa - Não afeta o uso</option>
              <option value="media">🟡 Média - Dificulta algumas tarefas</option>
              <option value="alta">🔴 Alta - Impede trabalho importante</option>
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="descricao" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Descrição do Problema
            </label>
            <textarea
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              required
              rows={6}
              placeholder="Descreva detalhadamente o problema, incluindo:&#10;- O que você estava fazendo&#10;- O que aconteceu&#10;- O que deveria ter acontecido&#10;- Mensagens de erro (se houver)"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => window.close()}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={enviando}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {enviando ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar Relato
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
