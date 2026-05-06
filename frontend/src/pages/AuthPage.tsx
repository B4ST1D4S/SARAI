import { useState } from 'react';
import { motion } from 'framer-motion';
import { login, register } from '../services/api';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // LOGIN
        const response = await login({
          email: formData.email,
          password: formData.password,
        });

        if (response.error) {
          setError(response.error);
          return;
        }

        // Guardar token
        localStorage.setItem('accessToken', response.data?.accessToken || '');
        localStorage.setItem('user', JSON.stringify(response.data?.user));
        
        // Redirigir
        window.location.href = '/dashboard';
      } else {
        // REGISTRO
        const response = await register({
          email: formData.email,
          password: formData.password,
          nombre: formData.nombre,
          apellido: formData.apellido,
          rol: 'MEDICO',
        });

        if (response.error) {
          setError(response.error);
          return;
        }

        // Guardar token
        localStorage.setItem('accessToken', response.data?.accessToken || '');
        localStorage.setItem('user', JSON.stringify(response.data?.user));
        
        // Redirigir
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.message || 'Error en la operación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">SARAI</h1>
          <p className="text-gray-400">Sistema Ágil de Registro y Asistencia Inteligente</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 border border-yellow-600/20 rounded-xl p-8 backdrop-blur">
          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                isLogin
                  ? 'bg-yellow-600 text-white'
                  : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                !isLogin
                  ? 'bg-yellow-600 text-white'
                  : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
              }`}
            >
              Registro
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required={!isLogin}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-600 focus:outline-none"
                />
                <input
                  type="text"
                  name="apellido"
                  placeholder="Apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  required={!isLogin}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-600 focus:outline-none"
                />
              </>
            )}

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-600 focus:outline-none"
            />

            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-600 focus:outline-none"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Cargando...' : isLogin ? 'Ingresar' : 'Registrarse'}
            </button>
          </form>
        </div>

        {/* Demo */}
        <p className="text-center text-gray-500 text-sm mt-6">
          📧 Demo: medico@estegia.com | 🔑 123456
        </p>
      </motion.div>
    </div>
  );
}
