import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { LogOut, Clock, User, CheckCircle, XCircle, RefreshCw, Plus, Settings, Calendar as CalIcon, Save, Power, Lock, Unlock, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { ModalAgendamento } from '../components/ModalAgendamento';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('agenda');
  
  // DADOS
  const [agendamentos, setAgendamentos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [galeria, setGaleria] = useState([]); 
  const [config, setConfig] = useState({ agenda_aberta: false, inicio_expediente: '09:00' });
  
  // UI
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [filtro, setFiltro] = useState('hoje');
  const [novoServico, setNovoServico] = useState({ nome: '', preco: '', duracao_min: 30 });
  const [uploading, setUploading] = useState(false); 

  useEffect(() => {
    verificarUsuario();
  }, []);

  async function verificarUsuario() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) navigate('/login');
    else buscarTudo();
  }

  async function buscarTudo() {
    setLoading(true);
    await Promise.all([buscarAgendamentos(), buscarServicos(), buscarConfig(), buscarGaleria()]);
    setLoading(false);
  }

  // --- GALERIA E UPLOAD ---
  async function buscarGaleria() {
    const { data } = await supabase.from('galeria').select('*').order('created_at', { ascending: false });
    setGaleria(data || []);
  }

  async function handleUpload(e) {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('cortes').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('cortes').getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('galeria').insert([{ url: publicUrl }]);
      if (dbError) throw dbError;

      alert('Foto adicionada com sucesso!');
      buscarGaleria();

    } catch (error) {
      alert('Erro no upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  }

  async function deletarFoto(id, url) {
    if (!confirm('Tem certeza que quer apagar essa foto?')) return;
    
    await supabase.from('galeria').delete().eq('id', id);
    const nomeArquivo = url.split('/').pop();
    await supabase.storage.from('cortes').remove([nomeArquivo]);
    
    buscarGaleria();
  }

  // --- CONFIG ---
  async function buscarConfig() {
    const { data } = await supabase.from('configuracoes').select('*').single();
    if (data) setConfig(data);
  }

  // --- ALTERAÇÃO AQUI: CONFIRMAÇÃO DE SEGURANÇA ---
  async function alternarAgenda() {
    const acao = config.agenda_aberta ? "FECHAR" : "ABRIR";
    const confirmacao = confirm(`ATENÇÃO: Você tem certeza que deseja ${acao} a agenda?`);
    
    if (!confirmacao) return; // Se ele clicar em Cancelar, para tudo.

    const novoStatus = !config.agenda_aberta;
    const { error } = await supabase.from('configuracoes').update({ agenda_aberta: novoStatus }).eq('id', config.id);
    
    if (!error) {
        setConfig({ ...config, agenda_aberta: novoStatus });
    } else {
        alert("Erro ao alterar status.");
    }
  }

  async function salvarHorarioInicio() {
    const { error } = await supabase.from('configuracoes').update({ inicio_expediente: config.inicio_expediente }).eq('id', config.id);
    if (!error) alert('Horário atualizado!');
  }

  // --- SERVIÇOS ---
  async function buscarServicos() {
    const { data } = await supabase.from('servicos').select('*').order('id');
    setServicos(data || []);
  }
  async function salvarEdicaoServico(servico) {
    const { error } = await supabase.from('servicos').update({ nome: servico.nome, preco: servico.preco, duracao_min: servico.duracao_min, ativo: servico.ativo }).eq('id', servico.id);
    if (!error) { alert('Serviço atualizado!'); buscarServicos(); } else { alert('Erro ao salvar.'); }
  }
  async function criarServico(e) {
    e.preventDefault();
    const { error } = await supabase.from('servicos').insert([{ nome: novoServico.nome, preco: novoServico.preco, duracao_min: novoServico.duracao_min, ativo: true }]);
    if (!error) { setNovoServico({ nome: '', preco: '', duracao_min: 30 }); buscarServicos(); alert('Serviço criado!'); }
  }

  // --- AGENDA ---
  async function buscarAgendamentos() {
    const { data } = await supabase.from('agendamentos').select(`*, servicos (nome, duracao_min, preco)`).order('data_hora', { ascending: true });
    setAgendamentos(data || []);
  }
  async function atualizarStatus(id, novoStatus) {
    const { error } = await supabase.from('agendamentos').update({ status: novoStatus }).eq('id', id);
    if (error) alert('Erro ao atualizar status. Verifique permissões.');
    else buscarAgendamentos();
  }
  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  const agendamentosFiltrados = agendamentos.filter(item => filtro === 'hoje' ? isToday(parseISO(item.data_hora)) : true);
  const statusColors = { pendente: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10', confirmado: 'text-blue-400 border-blue-400/30 bg-blue-400/10', concluido: 'text-green-500 border-green-500/30 bg-green-500/10', cancelado: 'text-red-500 border-red-500/30 bg-red-500/10 opacity-50' };

  return (
    <div className="min-h-screen bg-vintage-900 text-vintage-50 p-4 pb-24">
      <ModalAgendamento isOpen={modalAberto} onClose={() => {setModalAberto(false); buscarAgendamentos();}} servicos={servicos.filter(s => s.ativo)} />

      <div className="flex justify-between items-center mb-6 border-b border-vintage-gold/20 pb-4">
        <div><h1 className="text-2xl font-serif text-vintage-gold">Painel Admin</h1><p className="text-xs text-vintage-200">Barbearia LB</p></div>
        <button onClick={handleLogout} className="p-2 text-vintage-200 hover:text-red-400"><LogOut size={20} /></button>
      </div>

      <div className="bg-vintage-800 p-4 rounded-lg border border-vintage-gold/30 mb-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-vintage-gold flex items-center gap-2"><Power size={20} /> Status da Agenda</h3>
          <button onClick={alternarAgenda} className={`flex items-center gap-2 px-4 py-2 rounded font-bold transition-colors ${config.agenda_aberta ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{config.agenda_aberta ? <><Unlock size={18}/> ABERTA</> : <><Lock size={18}/> FECHADA</>}</button>
        </div>
        {config.agenda_aberta && (<div className="flex items-end gap-4 animate-fadeIn"><div className="flex-1"><label className="text-xs text-vintage-200 block mb-1">Início Expediente:</label><input type="time" className="w-full bg-vintage-900 border border-vintage-gold/20 p-2 rounded text-vintage-50 font-bold outline-none [color-scheme:dark]" value={config.inicio_expediente} onChange={e => setConfig({...config, inicio_expediente: e.target.value})} /></div><button onClick={salvarHorarioInicio} className="bg-vintage-gold text-vintage-900 font-bold p-2.5 rounded hover:bg-vintage-goldHover"><Save size={20} /></button></div>)}
      </div>

      <div className="flex gap-4 mb-6 overflow-x-auto">
        <button onClick={() => setActiveTab('agenda')} className={`flex items-center gap-2 pb-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'agenda' ? 'border-vintage-gold text-vintage-gold' : 'border-transparent text-vintage-200'}`}><CalIcon size={18} /> Agenda</button>
        <button onClick={() => setActiveTab('servicos')} className={`flex items-center gap-2 pb-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'servicos' ? 'border-vintage-gold text-vintage-gold' : 'border-transparent text-vintage-200'}`}><Settings size={18} /> Serviços</button>
        <button onClick={() => setActiveTab('galeria')} className={`flex items-center gap-2 pb-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'galeria' ? 'border-vintage-gold text-vintage-gold' : 'border-transparent text-vintage-200'}`}><ImageIcon size={18} /> Galeria</button>
      </div>

      {activeTab === 'agenda' && (
        <>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setFiltro('hoje')} className={`px-4 py-2 rounded-full text-sm font-bold ${filtro === 'hoje' ? 'bg-vintage-gold text-vintage-900' : 'bg-vintage-800 text-vintage-200'}`}>📅 Hoje</button>
            <button onClick={() => setFiltro('todos')} className={`px-4 py-2 rounded-full text-sm font-bold ${filtro === 'todos' ? 'bg-vintage-gold text-vintage-900' : 'bg-vintage-800 text-vintage-200'}`}>∞ Todos</button>
            <button onClick={buscarAgendamentos} className="ml-auto bg-vintage-800 p-2 rounded-full text-vintage-gold"><RefreshCw size={18} /></button>
          </div>
          <div className="space-y-4">
            {loading ? <p className="text-center opacity-50">Carregando...</p> : agendamentosFiltrados.length === 0 ? <p className="text-center opacity-50 py-10">Agenda vazia.</p> : agendamentosFiltrados.map((item) => (
              <div key={item.id} className={`bg-vintage-800 rounded-lg p-4 border-l-4 shadow-lg ${item.status === 'cancelado' ? 'border-l-red-900 opacity-60' : 'border-l-vintage-gold border-vintage-gold/10'}`}>
                <div className="flex justify-between items-start mb-2"><div className="flex items-center gap-2 text-xl font-bold text-vintage-50"><Clock size={20} className="text-vintage-gold" /> {format(parseISO(item.data_hora), 'HH:mm')}</div><span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${statusColors[item.status]}`}>{item.status}</span></div>
                <div className="mb-3"><h3 className="font-serif text-lg text-vintage-100 flex items-center gap-2"><User size={16} /> {item.cliente_nome}</h3><p className="text-sm text-vintage-200/70 ml-6">{item.servicos?.nome}</p></div>
                {item.status !== 'cancelado' && item.status !== 'concluido' && (<div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-vintage-gold/10"><button onClick={() => atualizarStatus(item.id, 'cancelado')} className="flex items-center justify-center gap-2 py-2 rounded text-red-400 hover:bg-red-400/10 text-xs font-bold uppercase"><XCircle size={14} /> Cancelar</button><button onClick={() => atualizarStatus(item.id, 'concluido')} className="flex items-center justify-center gap-2 py-2 rounded bg-vintage-gold text-vintage-900 hover:bg-vintage-goldHover text-xs font-bold uppercase"><CheckCircle size={14} /> Concluir</button></div>)}
              </div>
            ))}
          </div>
          <button onClick={() => setModalAberto(true)} className="fixed bottom-6 right-6 bg-vintage-gold hover:bg-vintage-goldHover text-vintage-900 p-4 rounded-full shadow-2xl transition-transform hover:scale-110 z-50"><Plus size={28} strokeWidth={3} /></button>
        </>
      )}

      {activeTab === 'servicos' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="bg-vintage-800 p-4 rounded border border-vintage-gold/20"><h3 className="text-vintage-gold font-serif mb-4 flex items-center gap-2"><Plus size={18}/> Novo Serviço</h3><form onSubmit={criarServico} className="grid gap-3"><input type="text" placeholder="Nome" className="bg-vintage-900 border border-vintage-gold/20 p-2 rounded text-white" value={novoServico.nome} onChange={e => setNovoServico({...novoServico, nome: e.target.value})} required /><div className="grid grid-cols-2 gap-2"><input type="number" placeholder="R$" className="bg-vintage-900 border border-vintage-gold/20 p-2 rounded text-white" value={novoServico.preco} onChange={e => setNovoServico({...novoServico, preco: e.target.value})} required /><input type="number" placeholder="Min" className="bg-vintage-900 border border-vintage-gold/20 p-2 rounded text-white" value={novoServico.duracao_min} onChange={e => setNovoServico({...novoServico, duracao_min: e.target.value})} required /></div><button type="submit" className="bg-vintage-gold text-vintage-900 font-bold py-2 rounded mt-2">Adicionar</button></form></div>
          <div className="space-y-4"><h3 className="text-vintage-200 text-sm uppercase tracking-widest">Editar Existentes</h3>{servicos.map(s => (<div key={s.id} className={`bg-vintage-800 p-4 rounded border ${s.ativo ? 'border-vintage-gold/10' : 'border-red-900/50 opacity-50'}`}><div className="grid gap-2 mb-2"><div className="flex items-center gap-2"><span className="text-xs text-vintage-200 w-12">Nome:</span><input className="bg-transparent border-b border-vintage-gold/20 w-full text-vintage-50 focus:border-vintage-gold outline-none" value={s.nome} onChange={(e) => { const newS = servicos.map(i => i.id === s.id ? {...i, nome: e.target.value} : i); setServicos(newS); }} /></div><div className="flex gap-4"><div className="flex items-center gap-2"><span className="text-xs text-vintage-200">R$:</span><input type="number" className="bg-transparent border-b border-vintage-gold/20 w-20 text-vintage-gold font-bold focus:border-vintage-gold outline-none" value={s.preco} onChange={(e) => { const newS = servicos.map(i => i.id === s.id ? {...i, preco: e.target.value} : i); setServicos(newS); }} /></div><div className="flex items-center gap-2"><span className="text-xs text-vintage-200">Min:</span><input type="number" className="bg-transparent border-b border-vintage-gold/20 w-16 text-vintage-50 focus:border-vintage-gold outline-none" value={s.duracao_min} onChange={(e) => { const newS = servicos.map(i => i.id === s.id ? {...i, duracao_min: e.target.value} : i); setServicos(newS); }} /></div></div></div><div className="flex justify-between items-center mt-3 pt-3 border-t border-vintage-gold/10"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={s.ativo} onChange={(e) => { const newS = servicos.map(i => i.id === s.id ? {...i, ativo: e.target.checked} : i); setServicos(newS); }} /><span className={`text-xs ${s.ativo ? 'text-green-400' : 'text-red-400'}`}>{s.ativo ? 'Ativo' : 'Oculto'}</span></label><button onClick={() => salvarEdicaoServico(s)} className="text-vintage-gold hover:text-white bg-vintage-gold/10 p-2 rounded-full"><Save size={18} /></button></div></div>))}</div>
        </div>
      )}

      {activeTab === 'galeria' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-vintage-800 p-6 rounded border border-vintage-gold/20 text-center">
            <Upload className="mx-auto text-vintage-gold mb-4" size={32} />
            <p className="text-vintage-100 mb-4">Adicionar foto à Galeria</p>
            <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="block w-full text-sm text-vintage-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-vintage-gold file:text-vintage-900 hover:file:bg-vintage-goldHover cursor-pointer"/>
            {uploading && <p className="text-vintage-gold text-sm mt-2 animate-pulse">Enviando foto...</p>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galeria.map(foto => (
              <div key={foto.id} className="relative group">
                <img src={foto.url} className="w-full h-32 object-cover rounded border border-vintage-gold/10" />
                <button onClick={() => deletarFoto(foto.id, foto.url)} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}