import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { globalRateLimit, securityHeaders } from './middlewares/security';

// carrega as configs do .env
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);

// lista de origens permitidas pra CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://projetodashboard.vercel.app',
  'https://projetodashboard-uebg.onrender.com',
  process.env.FRONTEND_URL,
];

app.use(cors({
  origin: (origin, callback) => {
    // permite requests sem origin (tipo apps mobile)
    if (!origin) {
      return callback(null, true);
    }

    // tira a barra do final pra normalizar
    const normalizedOrigin = origin.replace(/\/$/, '');
    const isAllowed = allowedOrigins.some(allowed => {
      if (!allowed) return false;
      const normalizedAllowed = allowed.replace(/\/$/, '');
      return normalizedOrigin === normalizedAllowed;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('CORS não permitido'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(securityHeaders);
app.use(globalRateLimit);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// logs só em dev pra não poluir produção
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
  });
}

// endpoint raiz só pra checar se tá vivo
app.get('/', (req, res) => {
  res.send('API Online 🚀');
});

// todas as rotas principais
app.use('/api', routes);

// pega rotas que não existem
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// tratamento de erros - tem que ser o último
app.use(errorHandler);

// sobe o servidor
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
});

export default app;
