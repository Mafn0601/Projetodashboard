'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle, CheckCircle2, Send, XCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function RelatarProblemaPage() {
  const [formData, setFormData] = useState({
    assunto: '',
    descricao: '',
    email: '',
    urgencia: 'MEDIA',
  });
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro(null);

    console.log('📤 Enviando chamado para:', `${API_URL}/api/chamados`);
    console.log('📦 Dados:', { email: formData.email, assunto: formData.assunto, urgencia: formData.urgencia });

    try {
      const response = await fetch(`${API_URL}/api/chamados`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          assunto: formData.assunto,
          urgencia: formData.urgencia,
          descricao: formData.descricao,
        }),
      });

      console.log('📨 Resposta status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erro da API:', errorData);
        throw new Error(errorData.error || 'Erro ao enviar chamado');
      }

      const data = await response.json();
      console.log('✅ Chamado criado:', data);

      setEnviado(true);

      // Reset após 3 segundos
      setTimeout(() => {
        setEnviado(false);
        setFormData({
          assunto: '',
          descricao: '',
          email: '',
          urgencia: 'MEDIA',
        });
      }, 3000);
    } catch (error) {
      console.error('❌ Erro ao enviar chamado:', error);
      setErro(error instanceof Error ? error.message : 'Erro desconhecido ao enviar chamado');
    } finally {
      setEnviando(false);
    }
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

        {/* Erro */}
        {erro && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900 dark:text-red-100 mb-1">Erro ao enviar</h3>
              <p className="text-sm text-red-700 dark:text-red-300">{erro}</p>
            </div>
          </div>
        )}

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
              <option value="BAIXA">🟢 Baixa - Não afeta o uso</option>
              <option value="MEDIA">🟡 Média - Dificulta algumas tarefas</option>
              <option value="ALTA">🔴 Alta - Impede trabalho importante</option>
              <option value="CRITICA">🔴 Crítica - Sistema completamente inoperante</option>
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
