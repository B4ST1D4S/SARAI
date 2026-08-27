// Setup global de tests - variables de entorno para testing
process.env.JWT_SECRET = 'tu_secreto_jwt_muy_largo_y_aleatorio_aqui_2024';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.ploutbwccyhortxixjcs:zonadevSARAI@aws-1-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require';
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';
