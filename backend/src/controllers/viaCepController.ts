import { Request, Response } from 'express';
import { AppError } from '../middlewares/errorHandler';
import { z } from 'zod';

// Schema para validação do CEP
const cepParamsSchema = z.object({
  cep: z.string()
    .min(8, 'CEP deve ter pelo menos 8 dígitos')
    .max(8, 'CEP deve ter no máximo 8 dígitos')
    .regex(/^\d+$/, 'CEP deve conter apenas números')
});

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  complemento?: string;
  erro?: boolean;
}

export const viaCepController = {
  // GET /api/cep/:cep
  async search(req: Request, res: Response) {
    try {
      const { cep } = cepParamsSchema.parse({ cep: req.params.cep });

      // Fazer requisição para a API ViaCEP
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = (await response.json()) as ViaCepResponse;

      // Se CEP não encontrado, retornar erro
      if (data.erro) {
        throw new AppError('CEP não encontrado', 404);
      }

      // Retornar os dados formatados
      return res.status(200).json({
        cep: data.cep,
        rua: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        estado: data.uf,
        complemento: data.complemento
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validação de CEP falhou',
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }

      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      console.error('Erro ao buscar CEP:', error);
      return res.status(500).json({ error: 'Erro ao buscar CEP' });
    }
  }
};
