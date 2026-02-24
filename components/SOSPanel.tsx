import React, { useState, useEffect, useCallback } from 'react';
import { EmergencyContact } from '../types';

const LS_CONTACTS = 'av_emergency_contacts';

function load<T>(key: string, fallback: T): T {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
    catch { return fallback; }
}
function save(key: string, value: unknown) { localStorage.setItem(key, JSON.stringify(value)); }
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export const SOSPanel: React.FC = () => {
    const [contacts, setContacts] = useState<EmergencyContact[]>(() => load(LS_CONTACTS, []));
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', relation: '' });
    const [sosActive, setSosActive] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => { save(LS_CONTACTS, contacts); }, [contacts]);

    const addContact = useCallback(() => {
        if (!form.name.trim() || !form.phone.trim()) return;
        if (contacts.length >= 3) { alert('Maximum 3 emergency contacts allowed.'); return; }
        const c: EmergencyContact = {
            id: uid(), name: form.name.trim(), phone: form.phone.trim(),
            relation: form.relation.trim() || undefined,
        };
        setContacts(p => [...p, c]);
        setForm({ name: '', phone: '', relation: '' });
        setShowForm(false);
    }, [form, contacts]);

    const deleteContact = useCallback((id: string) => {
        setContacts(p => p.filter(c => c.id !== id));
    }, []);

    const triggerSOS = () => {
        if (contacts.length === 0) {
            alert('⚠️ No emergency contacts added. Please add at least one contact before using SOS.');
            return;
        }
        setSosActive(true);
        if ('vibrate' in navigator) navigator.vibrate([100, 100, 100, 100, 100, 300, 300, 100, 300, 100, 300, 300, 100, 100, 100, 100, 100]);
        window.location.href = `tel:${contacts[0].phone}`;
        setTimeout(() => setSosActive(false), 3000);
    };

    const shareContacts = async () => {
        const text = contacts.map(c => `${c.name}${c.relation ? ` (${c.relation})` : ''}: ${c.phone}`).join('\n');
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <h2 className="text-4xl sm:text-5xl font-serif font-black tracking-tighter text-white italic">Emergency SOS</h2>

            {/* Big SOS Button - Retro-Futurist Glossy */}
            <div className="flex flex-col items-center py-12 space-y-8 bg-black/40 border border-red-500/20 rounded-[3rem] backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                <p className="text-red-400 text-[10px] text-center max-w-xs font-black uppercase tracking-[0.3em] leading-relaxed opacity-60">
                    Immediate Response Terminal
                </p>

                <div className="relative group">
                    <div className="absolute inset-0 rounded-full bg-red-600/20 blur-3xl group-hover:bg-red-600/40 transition-all duration-700 animate-pulse scale-150"></div>
                    <button
                        onClick={triggerSOS}
                        className={`relative w-48 h-48 rounded-full font-serif font-black text-6xl text-white shadow-2xl transition-all duration-500 active:scale-90 focus:outline-none border-8
                            ${sosActive
                                ? 'bg-red-800 border-red-400/50 scale-95 shadow-[0_0_80px_rgba(220,38,38,0.6)]'
                                : 'bg-red-600 border-white/10 hover:border-red-400/50 hover:scale-105'
                            }`}
                        aria-label="SOS Emergency Button"
                    >
                        <span className="relative z-10 drop-shadow-2xl">SOS</span>
                        {sosActive && (
                            <span className="absolute inset-0 rounded-full bg-red-400 opacity-60 animate-ping" />
                        )}
                        {/* Ring animation */}
                        <div className="absolute inset-0 rounded-full border-2 border-white/20 scale-110 animate-pulse"></div>
                    </button>
                </div>

                {sosActive && (
                    <div className="bg-white text-red-600 px-6 py-2 rounded-full font-black animate-bounce shadow-2xl border-2 border-red-600">
                        📞 INITIALIZING CALL...
                    </div>
                )}
            </div>

            {/* Emergency Contacts */}
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <h3 className="text-2xl font-serif font-black tracking-tight text-white/90 italic">Contact Registry</h3>
                    {contacts.length < 3 && (
                        <button onClick={() => setShowForm(s => !s)}
                            className="bg-yellow-400 hover:bg-yellow-300 text-teal-950 font-black px-6 py-3 rounded-2xl transition-all duration-300 shadow-xl active:scale-95 text-[11px] uppercase tracking-widest border-b-4 border-yellow-600">
                            {showForm ? '✕ Close' : '+ Secure Contact'}
                        </button>
                    )}
                </div>

                {/* Add form - Retro-Futurist */}
                {showForm && (
                    <div className="bg-teal-950/40 rounded-[2.5rem] border-2 border-yellow-400/30 p-8 space-y-6 backdrop-blur-3xl animate-in slide-in-from-top-6 duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                        <h4 className="font-serif font-black text-yellow-400 text-2xl tracking-tight uppercase italic">New Emergency Node</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-yellow-400/60 uppercase tracking-[0.2em]">Contact Full Name</label>
                                <input className="w-full bg-black/40 border-2 border-white/10 rounded-2xl px-5 py-4 text-white font-bold text-lg focus:outline-none focus:border-yellow-400 transition-all placeholder:text-slate-700"
                                    placeholder="RECIPIENT NAME" value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-yellow-400/60 uppercase tracking-[0.2em]">Secure Phone String</label>
                                <input type="tel" className="w-full bg-black/40 border-2 border-white/10 rounded-2xl px-5 py-4 text-white font-bold text-lg focus:outline-none focus:border-yellow-400 transition-all placeholder:text-slate-700"
                                    placeholder="+91 XXX XXX XXXX" value={form.phone}
                                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                            </div>
                        </div>
                        <button onClick={addContact}
                            className="w-full bg-yellow-400 hover:bg-yellow-300 text-teal-950 font-black py-5 rounded-2xl transition-all shadow-2xl active:scale-95 text-xl tracking-tighter uppercase border-b-4 border-yellow-600">
                            Validate & Commit Contact
                        </button>
                    </div>
                )}

                {contacts.length === 0 && !showForm && (
                    <div className="text-center py-20 bg-teal-950/20 rounded-[3.5rem] border-2 border-dashed border-white/5">
                        <p className="text-6xl mb-6 grayscale opacity-20">👤</p>
                        <p className="text-2xl font-serif font-black text-slate-500 tracking-tight italic uppercase">Registry Empty</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mt-4">Zero responders detected in local stack.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                    {contacts.map((c, i) => (
                        <div key={c.id} className="group glass bg-black/20 border-white/5 rounded-[2.25rem] flex items-center gap-6 px-8 py-6 transition-all duration-500 hover:bg-teal-900/40 hover:-translate-y-1">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-teal-950 font-black text-xl flex-shrink-0 shadow-lg border-2 border-white/10
                  ${i === 0 ? 'bg-yellow-400' : 'bg-white/10 text-white'}`}>
                                {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-serif font-black text-2xl text-white tracking-tight uppercase italic leading-none mb-1">{c.name}</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 mb-2">{c.relation || 'Priority Contact'}</p>
                                <a href={`tel:${c.phone}`} className="text-slate-400 font-bold hover:text-white transition-colors flex items-center gap-2 text-lg">
                                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                                    {c.phone}
                                </a>
                            </div>
                            <button onClick={() => deleteContact(c.id)} className="p-4 text-slate-700 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100" title="Purge">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>

                {contacts.length > 0 && (
                    <button onClick={shareContacts}
                        className="w-full py-5 border-2 border-white/5 bg-white/5 hover:bg-yellow-400/10 text-slate-500 hover:text-yellow-400 font-black rounded-2xl transition-all duration-500 text-[10px] uppercase tracking-[0.4em]">
                        {copied ? '✓ COMMITTED TO SYSTEM CLIPBOARD' : 'EXPORT EMERGENCY MANIFEST'}
                    </button>
                )}
            </div>
        </div>

    );
};
