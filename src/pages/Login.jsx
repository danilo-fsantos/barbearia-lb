import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, User, Key } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Se já estiver logado, manda pro admin direto
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/admin');
    });
  }, [navigate]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Erro: Verifique email e senha.');
    } else {
      navigate('/admin');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-vintage-900 flex items-center justify-center p-4 relative">
      
      {/* BOTÃO VOLTAR AO INÍCIO */}
      <button 
        onClick={() => navigate('/')} 
        className="absolute top-6 left-6 text-vintage-200 hover:text-vintage-gold flex items-center gap-2 transition-colors font-bold"
      >
        <ArrowLeft size={20} /> Voltar ao Início
      </button>

      <div className="w-full max-w-md bg-vintage-800 p-8 rounded-lg border border-vintage-gold/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-full bg-vintage-gold/10 mb-4">
            <Lock size={32} className="text-vintage-gold" />
          </div>
          <h1 className="text-2xl font-serif text-vintage-50">Área Restrita</h1>
          <p className="text-vintage-200 text-sm mt-2">Acesso exclusivo para administradores.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-vintage-200 ml-1">Email</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-3 text-vintage-gold" />
              {/* REMOVIDO O EXEMPLO ESPECÍFICO PARA NÃO CONFUNDIR */}
              <input 
                type="email" 
                name="email"
                autoComplete="username"
                required 
                className="w-full bg-vintage-900 border border-vintage-gold/20 rounded p-2.5 pl-10 text-vintage-50 focus:border-vintage-gold outline-none transition-colors"
                placeholder="Digite seu email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-vintage-200 ml-1">Senha</label>
            <div className="relative">
              <Key size={18} className="absolute left-3 top-3 text-vintage-gold" />
              {/* REMOVIDO AS BOLINHAS FALSAS */}
              <input 
                type="password" 
                name="password"
                autoComplete="current-password"
                required 
                className="w-full bg-vintage-900 border border-vintage-gold/20 rounded p-2.5 pl-10 text-vintage-50 focus:border-vintage-gold outline-none transition-colors"
                placeholder="Digite sua senha..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-vintage-gold hover:bg-vintage-goldHover text-vintage-900 font-bold py-3 rounded transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Acessar Painel'}
          </button>
        </form>
      </div>
    </div>
  );
}