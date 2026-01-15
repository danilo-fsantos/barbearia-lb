import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Phone, Check, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../supabase';
import { format, addMinutes, setHours, setMinutes, isBefore, parseISO, isAfter, isToday, addDays } from 'date-fns';

export function ModalAgendamento({ isOpen, onClose, servicos }) {
  const [nome, setNome] = useState('');
  const [celular, setCelular] = useState('');
  const [data, setData] = useState('');
  const [servicoId, setServicoId] = useState('');
  
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [horaSelecionada, setHoraSelecionada] = useState(null);
  const [buscandoHorarios, setBuscandoHorarios] = useState(false);
  const [lojaConfig, setLojaConfig] = useState(null); 

  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (isOpen) checkLojaStatus();
  }, [isOpen]);

  useEffect(() => {
    if (data && servicoId && lojaConfig?.agenda_aberta) {
      buscarHorariosOcupados();
    }
  }, [data, servicoId, lojaConfig]);

  async function checkLojaStatus() {
    const { data } = await supabase.from('configuracoes').select('*').single();
    setLojaConfig(data);
  }

  // Helper para formatar tempo no select
  function formatDuration(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h > 0 && m > 0) return `${h}h ${m}min`;
    if (h > 0) return `${h}h`;
    return `${m} min`;
  }

  async function buscarHorariosOcupados() {
    setBuscandoHorarios(true);
    setHoraSelecionada(null);

    try {
      const servicoEscolhido = servicos.find(s => s.id == servicoId);
      const duracaoServico = servicoEscolhido ? servicoEscolhido.duracao_min : 30;

      const dataAlvo = parseISO(data);
      const dataSeguinte = addDays(dataAlvo, 1);
      
      const startQuery = `${format(dataAlvo, 'yyyy-MM-dd')}T00:00:00`;
      const endQuery = `${format(dataSeguinte, 'yyyy-MM-dd')}T23:59:59`;
      
      const { data: agendamentosDoDia } = await supabase
        .from('agendamentos')
        .select('data_hora, servicos(duracao_min)')
        .gte('data_hora', startQuery)
        .lte('data_hora', endQuery)
        .neq('status', 'cancelado');

      const periodosOcupados = agendamentosDoDia.map(ag => ({
        inicio: new Date(ag.data_hora).getTime(),
        fim: addMinutes(new Date(ag.data_hora), ag.servicos.duracao_min).getTime()
      }));

      const [horaInicioConfig, minInicioConfig] = lojaConfig.inicio_expediente.split(':');
      const HORARIO_ULTIMO_AGENDAMENTO = 23; 
      
      let horarioAtual = setMinutes(setHours(new Date(`${data}T00:00:00`), parseInt(horaInicioConfig)), parseInt(minInicioConfig));
      const horarioLimiteLoop = setMinutes(setHours(new Date(`${data}T00:00:00`), HORARIO_ULTIMO_AGENDAMENTO), 1);

      const slots = [];
      const agora = new Date();

      while (isBefore(horarioAtual, horarioLimiteLoop)) {
        const fimProvavel = addMinutes(horarioAtual, duracaoServico);
        
        const slotInicio = horarioAtual.getTime();
        const slotFim = fimProvavel.getTime();
        
        const temConflito = periodosOcupados.some(ocupado => {
          return (slotInicio < ocupado.fim && slotFim > ocupado.inicio);
        });

        const horarioJaPassou = isToday(parseISO(data)) && isAfter(agora, horarioAtual);

        if (!temConflito && !horarioJaPassou) {
          slots.push(format(horarioAtual, 'HH:mm'));
        }

        horarioAtual = addMinutes(horarioAtual, 30); 
      }
      setHorariosDisponiveis(slots);
    } catch (error) {
      console.error(error);
    } finally {
      setBuscandoHorarios(false);
    }
  }

  async function handleAgendar(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const dataHoraFinal = new Date(`${data}T${horaSelecionada}:00`);
      const { error } = await supabase.from('agendamentos').insert({
        cliente_nome: nome,
        cliente_celular: celular,
        data_hora: dataHoraFinal.toISOString(),
        servico_id: servicoId,
        status: 'pendente'
      });

      if (error) throw error;
      setSucesso(true);
      setTimeout(() => {
        setSucesso(false); onClose(); setNome(''); setCelular(''); setHoraSelecionada(null); setData(''); setServicoId('');
      }, 3000);
    } catch (error) {
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-vintage-900 border border-vintage-gold/30 rounded-lg p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-vintage-200 hover:text-vintage-gold"><X size={24} /></button>
        <h2 className="font-serif text-2xl text-vintage-gold mb-6 text-center">Agendar Horário</h2>

        {lojaConfig && !lojaConfig.agenda_aberta ? (
          <div className="text-center py-8 px-4">
            <div className="flex justify-center mb-4 text-vintage-gold opacity-50"><AlertCircle size={48} /></div>
            <h3 className="text-xl text-vintage-50 font-bold mb-2">Agenda Fechada</h3>
            <p className="text-vintage-200">{lojaConfig.mensagem_fechado || "Fechado"}</p>
            <button onClick={onClose} className="mt-6 bg-vintage-800 text-vintage-gold border border-vintage-gold/20 px-6 py-2 rounded hover:bg-vintage-gold hover:text-vintage-900 transition-colors">Voltar</button>
          </div>
        ) : sucesso ? (
          <div className="text-center py-10 animate-pulse">
            <div className="flex justify-center mb-4 text-green-500"><Check size={64} /></div>
            <h3 className="text-xl text-vintage-50">Agendamento Confirmado!</h3>
          </div>
        ) : (
          <form onSubmit={handleAgendar} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-sm text-vintage-200 ml-1">Seu Nome</label><div className="relative"><User size={18} className="absolute left-3 top-3 text-vintage-gold" /><input required type="text" placeholder="Nome" className="w-full bg-vintage-800 border border-vintage-gold/20 rounded p-2.5 pl-10 text-vintage-50 focus:border-vintage-gold outline-none" value={nome} onChange={e => setNome(e.target.value)} /></div></div>
              <div className="space-y-1"><label className="text-sm text-vintage-200 ml-1">WhatsApp</label><div className="relative"><Phone size={18} className="absolute left-3 top-3 text-vintage-gold" /><input required type="tel" placeholder="(00) 00000-0000" className="w-full bg-vintage-800 border border-vintage-gold/20 rounded p-2.5 pl-10 text-vintage-50 focus:border-vintage-gold outline-none" value={celular} onChange={e => setCelular(e.target.value)} /></div></div>
            </div>
            <div className="space-y-1"><label className="text-sm text-vintage-200 ml-1">Serviço</label>
            <select required className="w-full bg-vintage-800 border border-vintage-gold/20 rounded p-2.5 text-vintage-50 focus:border-vintage-gold outline-none" value={servicoId} onChange={e => setServicoId(e.target.value)}>
              <option value="">Selecione...</option>
              {servicos.map(s => {
                // Se o nome já tiver parênteses (ex: "Luzes (2h a 4h)"), não mostra a duração automática no select
                const mostrarDuracao = !s.nome.match(/\(\d+.*h\)/);
                return (
                  <option key={s.id} value={s.id}>
                    {s.nome} {mostrarDuracao ? `(${formatDuration(s.duracao_min)})` : ''} - R$ {s.preco}
                  </option>
                );
              })}
            </select>
            </div>
            <div className="space-y-1"><label className="text-sm text-vintage-200 ml-1">Dia</label><div className="relative"><Calendar size={18} className="absolute left-3 top-3 text-vintage-gold" /><input required type="date" min={new Date().toISOString().split('T')[0]} className="w-full bg-vintage-800 border border-vintage-gold/20 rounded p-2.5 pl-10 text-vintage-50 focus:border-vintage-gold outline-none [color-scheme:dark]" value={data} onChange={e => setData(e.target.value)} /></div></div>
            
            {data && servicoId && (
              <div className="space-y-2 animate-fadeIn">
                <label className="text-sm text-vintage-200 ml-1 flex items-center gap-2"><Clock size={14} /> Horários Disponíveis</label>
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {!buscandoHorarios && horariosDisponiveis.length === 0 && <p className="col-span-4 text-center text-sm text-red-400 py-2">Sem horários livres.</p>}
                  {horariosDisponiveis.map(hora => (
                    <button key={hora} type="button" onClick={() => setHoraSelecionada(hora)} className={`py-2 rounded text-sm font-bold transition-all border ${horaSelecionada === hora ? 'bg-vintage-gold text-vintage-900 border-vintage-gold' : 'bg-vintage-800 text-vintage-100 border-vintage-gold/20 hover:border-vintage-gold hover:text-vintage-gold'}`}>{hora}</button>
                  ))}
                </div>
              </div>
            )}
            <button type="submit" disabled={loading || !horaSelecionada} className="w-full bg-vintage-gold hover:bg-vintage-goldHover text-vintage-900 font-bold py-3 rounded mt-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{loading ? 'Confirmando...' : 'Confirmar Agendamento'}</button>
          </form>
        )}
      </div>
    </div>
  );
}