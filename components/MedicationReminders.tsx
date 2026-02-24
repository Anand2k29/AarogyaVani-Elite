import React, { useState, useEffect, useCallback } from 'react';
import { Medication, MedLog } from '../types';

const LS_MEDS = 'av_medications';
const LS_LOGS = 'av_med_logs';

function load<T>(key: string, fallback: T): T {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
    catch { return fallback; }
}
function save(key: string, value: unknown) {
    localStorage.setItem(key, JSON.stringify(value));
}
function todayStr() {
    return new Date().toISOString().split('T')[0];
}
function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const LANGUAGES = [
    { code: 'en-US', name: 'English' },
    { code: 'hi-IN', name: 'Hindi (हिंदी)' },
    { code: 'kn-IN', name: 'Kannada (ಕನ್ನಡ)' },
    { code: 'ta-IN', name: 'Tamil (தமிழ்)' },
    { code: 'te-IN', name: 'Telugu (తెలుగు)' },
    { code: 'ml-IN', name: 'Malayalam (മലയാളം)' },
    { code: 'mr-IN', name: 'Marathi (ಮರಾಠಿ)' },
    { code: 'bn-IN', name: 'Bengali (বাংলা)' },
] as any;

const FREQ_PRESETS = [
    { label: 'Once a day', times: ['08:00'] },
    { label: 'Twice a day', times: ['08:00', '20:00'] },
    { label: 'Three times a day', times: ['08:00', '14:00', '20:00'] },
    { label: 'Custom', times: [] },
];

export const MedicationReminders: React.FC = () => {
    const [meds, setMeds] = useState<Medication[]>(() => load(LS_MEDS, []));
    const [logs, setLogs] = useState<MedLog[]>(() => load(LS_LOGS, []));
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({ name: '', dosage: '', preset: 0, customTime: '08:00', notes: '', lang: 'en-US' });

    useEffect(() => { save(LS_MEDS, meds); }, [meds]);
    useEffect(() => { save(LS_LOGS, logs); }, [logs]);

    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const speakReminder = (medName: string, dosage: string, langCode: string) => {
        if (!('speechSynthesis' in window)) return;
        const utterance = new SpeechSynthesisUtterance();
        utterance.lang = langCode;
        let text = `Time to take your medicine: ${medName}. Dosage: ${dosage}`;
        if (langCode.startsWith('hi')) text = `आपकी दवा लेने का समय हो गया है: ${medName}. खुराक: ${dosage}`;
        if (langCode.startsWith('kn')) text = `ನಿಮ್ಮ ಔಷಧಿಯನ್ನು ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯ: ${medName}. ಡೋಸೇಜ್: ${dosage}`;
        utterance.text = text;
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        const fire = () => {
            const now = new Date();
            const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const today = todayStr();
            meds.forEach(m => {
                m.times.forEach(t => {
                    if (t === hhmm) {
                        const alreadyLogged = logs.some(
                            l => l.medicationId === m.id && l.date === today && l.time === t
                        );
                        if (!alreadyLogged) {
                            if ('Notification' in window && Notification.permission === 'granted') {
                                new Notification(`💊 Time to take ${m.name}`, {
                                    body: `Dosage: ${m.dosage}`,
                                    icon: '/favicon.ico',
                                });
                            }
                            speakReminder(m.name, m.dosage, (m as any).lang || 'en-US');
                            if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
                        }
                    }
                });
            });
        };
        const interval = setInterval(fire, 60000);
        return () => clearInterval(interval);
    }, [meds, logs]);

    const addMed = useCallback(() => {
        const preset = FREQ_PRESETS[form.preset];
        const times = form.preset === FREQ_PRESETS.length - 1
            ? [form.customTime]
            : preset.times;
        if (!form.name.trim() || times.length === 0) return;
        const med: Medication = {
            id: uid(),
            name: form.name.trim(),
            dosage: form.dosage.trim() || '1 tablet',
            times,
            notes: form.notes.trim() || undefined,
            lang: form.lang
        } as any;
        setMeds(p => [...p, med]);
        setForm({ name: '', dosage: '', preset: 0, customTime: '08:00', notes: '', lang: 'en-US' });
        setShowForm(false);
    }, [form]);

    const deleteMed = useCallback((id: string) => {
        setMeds(p => p.filter(m => m.id !== id));
    }, []);

    const logDose = useCallback((med: Medication, time: string, status: 'taken' | 'skipped') => {
        const today = todayStr();
        const existing = logs.findIndex(l => l.medicationId === med.id && l.date === today && l.time === time);
        const entry: MedLog = {
            id: uid(), medicationId: med.id, medicationName: med.name,
            date: today, time, status, loggedAt: Date.now(),
        };
        if (existing >= 0) {
            setLogs(p => { const n = [...p]; n[existing] = entry; return n; });
        } else {
            setLogs(p => [...p, entry]);
        }
    }, [logs]);

    const getLog = (medId: string, time: string) =>
        logs.find(l => l.medicationId === medId && l.date === todayStr() && l.time === time);

    const recentLogs = [...logs].sort((a, b) => b.loggedAt - a.loggedAt).slice(0, 5);

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-4xl sm:text-5xl font-serif font-black tracking-tighter text-white italic">Medication Protocol</h2>
                <button
                    onClick={() => setShowForm(s => !s)}
                    className="bg-yellow-400 hover:bg-yellow-300 text-teal-950 text-[11px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl transition-all shadow-xl active:scale-95 border-b-4 border-yellow-600"
                >
                    {showForm ? '✕ Close' : '+ New Therapy'}
                </button>
            </div>

            {showForm && (
                <div className="bg-teal-950/40 rounded-[3rem] border-2 border-yellow-400/30 shadow-[0_32px_64px_rgba(0,0,0,0.5)] p-10 space-y-8 backdrop-blur-3xl animate-in slide-in-from-top-8 duration-500">
                    <h3 className="font-serif font-black text-yellow-400 text-3xl tracking-tight uppercase italic">New Molecule Entry</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-yellow-400/60 uppercase tracking-[0.25em]">Molecular Designation</label>
                            <input
                                className="w-full bg-black/40 border-2 border-white/10 rounded-2xl px-5 py-4 text-white font-bold text-lg focus:outline-none focus:border-yellow-400 transition-all placeholder:text-slate-700"
                                placeholder="e.g. PARACETAMOL"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-yellow-400/60 uppercase tracking-[0.25em]">Dosage Strength</label>
                            <input
                                className="w-full bg-black/40 border-2 border-white/10 rounded-2xl px-5 py-4 text-white font-bold text-lg focus:outline-none focus:border-yellow-400 transition-all placeholder:text-slate-700"
                                placeholder="e.g. 500 MG"
                                value={form.dosage}
                                onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-yellow-400/60 uppercase tracking-[0.25em]">Temporal Frequency</label>
                        <div className="flex flex-wrap gap-3">
                            {FREQ_PRESETS.map((p, i) => (
                                <button
                                    key={i}
                                    onClick={() => setForm(f => ({ ...f, preset: i }))}
                                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all duration-300 ${form.preset === i ? 'bg-yellow-400 text-teal-950 border-yellow-500 shadow-xl scale-105' : 'bg-black/20 text-slate-500 border-white/5 hover:border-yellow-400/40'}`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        {form.preset === FREQ_PRESETS.length - 1 && (
                            <div className="mt-8 p-6 bg-black/20 rounded-2xl border border-white/10 flex flex-col gap-4 animate-in fade-in duration-500">
                                <label className="block text-[10px] font-black text-yellow-400/60 uppercase tracking-[0.2em]">Select Target Time</label>
                                <input type="time" className="bg-black/40 border-2 border-white/10 rounded-xl px-4 py-3 text-white font-black text-2xl focus:outline-none focus:border-yellow-400 transition-all [color-scheme:dark]"
                                    value={form.customTime} onChange={e => setForm(f => ({ ...f, customTime: e.target.value }))} />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-yellow-400/60 uppercase tracking-[0.25em]">Synthesis Language</label>
                            <select
                                className="w-full bg-black/40 border-2 border-white/10 rounded-2xl px-5 py-4 text-white font-bold text-lg focus:outline-none focus:border-yellow-400 transition-all [color-scheme:dark]"
                                value={form.lang}
                                onChange={e => setForm(f => ({ ...f, lang: e.target.value }))}
                            >
                                {(LANGUAGES as any).map((l: any) => (
                                    <option key={l.code} value={l.code}>{l.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-yellow-400/60 uppercase tracking-[0.25em]">Special Directives</label>
                            <input className="w-full bg-black/40 border-2 border-white/10 rounded-2xl px-5 py-4 text-white font-bold text-lg focus:outline-none focus:border-yellow-400 transition-all placeholder:text-slate-700"
                                placeholder="e.g. POST-MEAL" value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                        </div>
                    </div>

                    <button onClick={addMed} className="w-full bg-yellow-400 hover:bg-yellow-300 text-teal-950 font-black py-6 rounded-2xl transition-all shadow-2xl active:scale-95 text-2xl tracking-tighter uppercase border-b-4 border-yellow-600">
                        Authorize Lifecycle Reminders
                    </button>
                </div>
            )}

            {meds.length === 0 && !showForm && (
                <div className="text-center py-24 bg-teal-950/20 rounded-[4rem] border-2 border-dashed border-white/5 space-y-6">
                    <p className="text-7xl grayscale opacity-20">💊</p>
                    <div className="space-y-2">
                        <p className="text-3xl font-serif font-black text-slate-500 tracking-tight uppercase italic">Therapy Stack Empty</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Initialize a new therapy path above.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {meds.map(med => (
                    <div key={med.id} className="group glass bg-black/30 border-white/5 rounded-[2.5rem] p-8 space-y-8 transition-all duration-500 hover:bg-teal-900/20 hover:-translate-y-1">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2">
                                <p className="text-3xl font-serif font-black text-white tracking-tight uppercase italic leading-none">{med.name}</p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-yellow-400/10 border border-yellow-400/20 rounded-full text-[10px] font-black text-yellow-400 uppercase tracking-widest">{med.dosage}</span>
                                    {med.notes && <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full text-[10px] font-black text-teal-400 uppercase tracking-widest">{med.notes}</span>}
                                </div>
                            </div>
                            <button onClick={() => deleteMed(med.id)} className="p-4 text-slate-700 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100" title="Decommission">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {med.times.map(t => {
                                const log = getLog(med.id, t);
                                return (
                                    <div key={t} className="flex items-center justify-between glass bg-black/40 rounded-2xl px-6 py-5 border border-white/5 transition-all hover:border-yellow-400/20 group/time">
                                        <div className="flex flex-col">
                                            <span className="text-2xl font-black text-white">{t}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Scheduled</span>
                                        </div>
                                        {log ? (
                                            <div className={`flex items-center gap-3 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${log.status === 'taken' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                {log.status === 'taken' ? '✓ Taken' : '✕ Skipped'}
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button onClick={() => logDose(med, t, 'taken')}
                                                    className="bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 shadow-xl">
                                                    Log Info
                                                </button>
                                                <button onClick={() => logDose(med, t, 'skipped')}
                                                    className="bg-black/20 hover:bg-red-500/10 text-slate-600 hover:text-red-400 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                                    Skip
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {recentLogs.length > 0 && (
                <div className="pt-10 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Historical Adherence manifests</h3>
                    </div>
                    <div className="bg-black/40 rounded-[3.5rem] border border-white/5 overflow-hidden shadow-2xl">
                        {recentLogs.map(l => (
                            <div key={l.id} className="flex items-center justify-between px-10 py-8 border-b border-white/5 last:border-0 hover:bg-yellow-400/5 transition-all group">
                                <div className="space-y-1">
                                    <p className="font-serif font-black text-white uppercase tracking-tight text-2xl leading-none italic group-hover:text-yellow-400 transition-colors">{l.medicationName}</p>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{l.date} @ {l.time}</p>
                                </div>
                                <div className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${l.status === 'taken' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' : 'bg-red-500/10 text-red-400 border-red-500/10'}`}>
                                    {l.status === 'taken' ? '✓ Confirmed taken' : '✕ Omitted'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

    );
};
