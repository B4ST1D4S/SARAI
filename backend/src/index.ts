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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARES
// ============================================

app.use(helmet());
app.use(cors());
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
// CONEXIÓN A BASE DE DATOS
// ============================================

async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// ============================================
// INICIO DEL SERVIDOR
// ============================================

async function startServer() {
  const dbConnected = await connectDatabase();
  
  if (!dbConnected) {
    console.error('Cannot start server without database connection');
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: PostgreSQL`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api/auth/login\n`);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await prisma.$disconnect();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

startServer().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
