import React, { useEffect, useState } from 'react';
import { Scissors, Calendar, Clock, Lock, X, ZoomIn, Instagram, Phone, MapPin } from 'lucide-react';
import { supabase } from './supabase';
import { ModalAgendamento } from './components/ModalAgendamento';

function App() {
  const [servicos, setServicos] = useState([]);
  const [fotosGaleria, setFotosGaleria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [imagemZoom, setImagemZoom] = useState(null);

  // --- CONFIGURAÇÃO ---
  const WHATSAPP_NUMERO = "5511999999999"; 
  const INSTAGRAM_LINK = "https://instagram.com/seu_insta";
  const ENDERECO_TEXTO = "Rua da Barbearia, 123";

  useEffect(() => {
    async function buscarDados() {
      setLoading(true);
      const { data: dadosServicos } = await supabase.from('servicos').select('*').eq('ativo', true).order('preco', { ascending: true });
      setServicos(dadosServicos || []);
      const { data: dadosGaleria } = await supabase.from('galeria').select('url').order('created_at', { ascending: false }).limit(8);
      setFotosGaleria(dadosGaleria || []);
      setLoading(false);
    }
    buscarDados();
  }, []);

  // Função para formatar o tempo bonito (ex: 90min vira 1h 30min)
  function formatDuration(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h > 0 && m > 0) return `${h}h ${m}min`;
    if (h > 0) return `${h}h`;
    return `${m} min`;
  }

  // Verifica se o nome já tem informação de tempo (ex: "Luzes (2h a 4h)")
  // Se tiver, a gente não mostra a tag automática pra não ficar redundante
  function deveMostrarDuracao(nome) {
    return !nome.match(/\(\d+.*h\)/); 
  }

  return (
    <div className="min-h-screen font-sans text-vintage-50 selection:bg-vintage-gold selection:text-vintage-900 relative">
      {imagemZoom && (<div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" onClick={() => setImagemZoom(null)}><button className="absolute top-4 right-4 text-vintage-50 hover:text-vintage-gold"><X size={32} /></button><img src={imagemZoom} alt="Zoom" className="max-w-full max-h-[90vh] rounded shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} /></div>)}
      <div className="fixed inset-0 z-0 opacity-15 pointer-events-none flex items-center justify-center overflow-hidden"><img src="/img/logo-bg.png" alt="Background Logo" className="w-[150%] max-w-none md:w-[800px] grayscale invert-0 mix-blend-overlay" /></div>
      <ModalAgendamento isOpen={modalAberto} onClose={() => setModalAberto(false)} servicos={servicos} />

      {/* NAVBAR */}
      <nav className="fixed w-full z-50 bg-vintage-900/95 border-b border-vintage-gold/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4"><div className="flex justify-between items-center h-20"><div className="flex items-center gap-2"><div className="bg-vintage-gold p-2 rounded-full text-vintage-900"><Scissors size={24} /></div><span className="font-serif text-2xl tracking-wider text-vintage-gold">BARBEARIA LB</span></div><div className="flex items-center gap-6"><div className="hidden md:flex gap-6 text-vintage-100 text-sm tracking-widest uppercase"><a href="#" className="hover:text-vintage-gold transition-colors">Início</a><a href="#servicos" className="hover:text-vintage-gold transition-colors">Serviços</a><a href="#galeria" className="hover:text-vintage-gold transition-colors">Cortes</a></div><a href="/login" className="text-vintage-200 hover:text-vintage-gold transition-colors" title="Área do Barbeiro"><Lock size={20} /></a><button onClick={() => setModalAberto(true)} className="bg-vintage-gold hover:bg-vintage-goldHover text-vintage-900 font-bold py-2 px-6 rounded transition-colors flex items-center gap-2"><Calendar size={18} /> <span className="hidden md:inline">Agendar</span></button></div></div></div>
      </nav>

      {/* HERO */}
      <section className="relative h-screen flex items-center justify-center bg-vintage-800/80 overflow-hidden z-10">
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto"><p className="text-vintage-gold tracking-[0.2em] uppercase mb-4 text-sm md:text-base font-bold">Estilo Clássico & Tradição</p><h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-vintage-50 mb-6 leading-tight">BARBEARIA <br /><span className="text-vintage-gold">LB</span></h1><p className="text-vintage-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light">Onde a tradição encontra o estilo moderno.</p><div className="flex flex-col md:flex-row gap-4 justify-center"><button onClick={() => setModalAberto(true)} className="bg-vintage-gold hover:bg-vintage-goldHover text-vintage-900 text-lg font-bold py-4 px-8 rounded transition-transform hover:scale-105">Agendar Horário</button><a href={`https://wa.me/${WHATSAPP_NUMERO}`} target="_blank" className="bg-transparent border border-vintage-gold text-vintage-gold hover:bg-vintage-gold hover:text-vintage-900 text-lg font-bold py-4 px-8 rounded transition-all flex items-center justify-center gap-2"><Phone size={20} /> Falar no WhatsApp</a></div></div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="py-20 bg-vintage-900/90 relative z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16"><h2 className="font-serif text-4xl text-vintage-gold mb-4">Nossos Serviços</h2><div className="h-1 w-24 bg-vintage-gold mx-auto"></div></div>
          <div className="grid md:grid-cols-1 gap-6">
            {loading ? <p className="text-center">Carregando...</p> : servicos.map((servico) => (
              <div key={servico.id} className="group relative bg-vintage-800 border border-vintage-gold/10 p-6 rounded-lg hover:border-vintage-gold/40 transition-all">
                <div className="flex justify-between items-center relative z-10">
                  <div>
                    <h3 className="text-xl font-serif text-vintage-50 group-hover:text-vintage-gold transition-colors">{servico.nome}</h3>
                    {/* SÓ MOSTRA O RELOGINHO SE NÃO TIVER TEMPO NO NOME */}
                    {deveMostrarDuracao(servico.nome) && (
                      <div className="flex items-center gap-2 text-vintage-200/60 text-sm mt-1">
                        <Clock size={14} /><span>{formatDuration(servico.duracao_min)}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-vintage-gold">R$ {servico.preco}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALERIA */}
      <section id="galeria" className="py-20 bg-vintage-800/90 relative z-10 border-t border-vintage-gold/10">
        <div className="max-w-6xl mx-auto px-4"><div className="text-center mb-16"><h2 className="font-serif text-4xl text-vintage-gold mb-4">Galeria de Cortes</h2><p className="text-vintage-200">Clique nas fotos para ampliar.</p></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{fotosGaleria.length === 0 ? (<div className="col-span-full text-center py-10 opacity-50"><p>Nossas fotos estão sendo reveladas...</p></div>) : (fotosGaleria.map((foto, index) => (<div key={index} onClick={() => setImagemZoom(foto.url)} className="aspect-square bg-vintage-900 rounded overflow-hidden border border-vintage-gold/20 cursor-zoom-in group relative"><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><ZoomIn className="text-vintage-gold" size={32} /></div><img src={foto.url} alt={`Corte ${index + 1}`} className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500" /></div>)))}</div></div>
      </section>

      {/* RODAPÉ */}
      <footer className="bg-vintage-900 border-t border-vintage-gold/20 pt-16 pb-8 relative z-10">
        <div className="max-w-6xl mx-auto px-4"><div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left"><div className="space-y-4"><div className="flex items-center justify-center md:justify-start gap-2 text-vintage-gold"><Scissors size={32} /><span className="font-serif text-2xl">BARBEARIA LB</span></div><p className="text-vintage-200 text-sm">Tradição e estilo.</p></div><div className="space-y-4"><h3 className="text-vintage-50 font-serif text-lg">Contato</h3><div className="space-y-2"><a href={`https://wa.me/${WHATSAPP_NUMERO}`} target="_blank" className="flex items-center justify-center md:justify-start gap-2 text-vintage-200 hover:text-green-400 transition-colors"><Phone size={18} /> <span>WhatsApp</span></a><a href={INSTAGRAM_LINK} target="_blank" className="flex items-center justify-center md:justify-start gap-2 text-vintage-200 hover:text-pink-400 transition-colors"><Instagram size={18} /> <span>Instagram</span></a></div></div><div className="space-y-4"><h3 className="text-vintage-50 font-serif text-lg">Localização</h3><div className="flex items-center justify-center md:justify-start gap-2 text-vintage-200"><MapPin size={18} className="shrink-0" /><span>{ENDERECO_TEXTO}</span></div><p className="text-xs text-vintage-200/50 mt-4">© 2024 Barbearia LB.</p></div></div></div>
      </footer>
    </div>
  );
}

export default App;