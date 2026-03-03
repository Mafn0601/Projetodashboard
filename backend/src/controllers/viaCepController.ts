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

interface CacheEntry {
  data: ViaCepResponse;
  timestamp: number;
}

// Cache em memória para CEPs (TTL: 1 hora)
const cepCache = new Map<string, CacheEntry>();
const CACHE_TTL = 3600000; // 1 hora em ms

function getCachedCep(cep: string): ViaCepResponse | null {
  const cached = cepCache.get(cep);
  if (!cached) return null;
  
  // Verificar se expirou
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cepCache.delete(cep);
    return null;
  }
  
  return cached.data;
}

function setCachedCep(cep: string, data: ViaCepResponse) {
  cepCache.set(cep, {
    data,
    timestamp: Date.now()
  });
}

export const viaCepController = {
  // GET /api/cep/:cep
  async search(req: Request, res: Response) {
    try {
      const { cep } = cepParamsSchema.parse({ cep: req.params.cep });

      // Verificar cache primeiro
      const cached = getCachedCep(cep);
      if (cached) {
        console.log(`✅ CEP ${cep} encontrado em cache`);
        return res.status(200).json({
          cep: cached.cep,
          rua: cached.logradouro,
          bairro: cached.bairro,
          cidade: cached.localidade,
          estado: cached.uf,
          complemento: cached.complemento
        });
      }

      // Fazer requisição para a API ViaCEP com timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'ProjetoDashboard/1.0'
          }
        });

        clearTimeout(timeout);

        const data = (await response.json()) as ViaCepResponse;

        // Se CEP não encontrado, retornar erro
        if (data.erro) {
          throw new AppError('CEP não encontrado', 404);
        }

        // Cachear o resultado
        setCachedCep(cep, data);

        // Retornar os dados formatados
        return res.status(200).json({
          cep: data.cep,
          rua: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf,
          complemento: data.complemento
        });
      } catch (fetchError) {
        clearTimeout(timeout);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return res.status(504).json({ error: 'Requisição ViaCEP expirou' });
        }
        throw fetchError;
      }
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
