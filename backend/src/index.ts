import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import prisma from './lib/prisma.js';
import authRoutes from './routes/auth.js';
import pacientesRoutes from './routes/pacientes.js';
import historiaClinicaRoutes from './routes/historiaClinica.js';
import cupsRoutes from './routes/cups.js';
import citasRoutes from './routes/citas.js';
import cotizacionesRoutes from './routes/cotizaciones.js';
import saraiRoutes from './routes/sarai.js';
import disponibilidadRoutes from './routes/disponibilidad.js';
import usuariosRoutes from './routes/usuarios.js';
import especialidadesRoutes from './routes/especialidades.js';
import adminRoutes from './routes/admin.js';
import pdfRoutes from './routes/pdf.js';
import mapaCorporalRoutes from './routes/mapaCorporal.js';
import crmRoutes from './routes/crm.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARES
// ============================================

app.use(helmet());
app.use(cors({
  origin: [
    'https://app-sarai.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// 20 MB para soportar audio base64
app.use(express.json({ limit: 20 * 1024 * 1024 }));
app.use(express.urlencoded({ extended: true, limit: 20 * 1024 * 1024 }));

// ============================================
// RUTAS
// ============================================

app.get('/', (req, res) => {
  res.json({ 
    message: 'EstetIA Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/historia-clinica', historiaClinicaRoutes);
app.use('/api/cups', cupsRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/sarai', saraiRoutes);
app.use('/api/disponibilidad', disponibilidadRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/especialidades', especialidadesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pdf',   pdfRoutes);
app.use('/api/mapa-corporal', mapaCorporalRoutes);
app.use('/api/crm',          crmRoutes);

// ============================================
// MANEJO DE ERRORES
// ============================================

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// ============================================
// INICIO DEL SERVIDOR (solo local)
// ============================================

// En Vercel se exporta directamente sin listen ni process.exit
if (!process.env.VERCEL) {
  prisma.$connect()
    .then(() => {
      console.log('✅ Database connected successfully');
      app.listen(PORT, () => {
        console.log(`\n🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🗄️  Database: PostgreSQL`);
        console.log(`📚 API Docs: http://localhost:${PORT}/api/auth/login\n`);
      });
    })
    .catch((error: unknown) => {
      console.error('❌ Database connection failed:', error);
    });
}

// Exportar app para Vercel serverless
export default app;
