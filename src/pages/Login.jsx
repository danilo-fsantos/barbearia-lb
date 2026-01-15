import React, { useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { Lock, Scissors } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert('Erro: ' + error.message);
    else navigate('/admin');
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-vintage-900 flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-vintage-800 p-8 rounded-lg border border-vintage-gold/20 shadow-2xl">
        <div className="flex justify-center mb-6 text-vintage-gold">
          <div className="bg-vintage-gold p-3 rounded-full text-vintage-900"><Scissors size={32} /></div>
        </div>
        <h2 className="text-2xl font-serif text-center text-vintage-50 mb-8">Acesso Restrito</h2>
        
        <div className="space-y-4">
          <div><label className="text-sm text-vintage-200 block mb-1">Email</label><input type="email" className="w-full bg-vintage-900 border border-vintage-gold/20 rounded p-3 text-vintage-50 focus:border-vintage-gold outline-none" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><label className="text-sm text-vintage-200 block mb-1">Senha</label><input type="password" className="w-full bg-vintage-900 border border-vintage-gold/20 rounded p-3 text-vintage-50 focus:border-vintage-gold outline-none" value={password} onChange={e => setPassword(e.target.value)} /></div>
          
          <div className="flex items-center gap-2">
            <input type="checkbox" id="lembrar" defaultChecked className="accent-vintage-gold w-4 h-4" />
            <label htmlFor="lembrar" className="text-sm text-vintage-200 cursor-pointer">Manter conectado</label>
          </div>

          <button disabled={loading} className="w-full bg-vintage-gold hover:bg-vintage-goldHover text-vintage-900 font-bold py-3 rounded transition-colors mt-4">{loading ? 'Entrando...' : 'Acessar Painel'}</button>
        </div>
      </form>
    </div>
  );
}