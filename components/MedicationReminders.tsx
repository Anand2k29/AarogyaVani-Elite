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
] as any; // Simplified for this implementation

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

    // Persist whenever state changes
    useEffect(() => { save(LS_MEDS, meds); }, [meds]);
    useEffect(() => { save(LS_LOGS, logs); }, [logs]);

    // Request Notification permission once
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Speech functionality
    const speakReminder = (medName: string, dosage: string, langCode: string) => {
        if (!('speechSynthesis' in window)) return;
        const utterance = new SpeechSynthesisUtterance();
        utterance.lang = langCode;

        // Dynamic message based on language
        let text = `Time to take your medicine: ${medName}. Dosage: ${dosage}`;
        if (langCode.startsWith('hi')) text = `आपकी दवा लेने का समय हो गया है: ${medName}. खुराक: ${dosage}`;
        if (langCode.startsWith('kn')) text = `ನಿಮ್ಮ ಔಷಧಿಯನ್ನು ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯ: ${medName}. ಡೋಸೇಜ್: ${dosage}`;

        utterance.text = text;
        window.speechSynthesis.speak(utterance);
    };

    // Check every minute for due reminders
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
                            // Text Notification
                            if ('Notification' in window && Notification.permission === 'granted') {
                                new Notification(`💊 Time to take ${m.name}`, {
                                    body: `Dosage: ${m.dosage}`,
                                    icon: '/favicon.ico',
                                });
                            }
                            // Voice Reminder (Phase 3)
                            speakReminder(m.name, m.dosage, (m as any).lang || 'en-US');

                            // Haptic Feedback
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

    const recentLogs = [...logs].sort((a, b) => b.loggedAt - a.loggedAt).slice(0, 10);

    return (
        <div className="space-y-6">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">💊 Medications</h2>
                <button
                    onClick={() => setShowForm(s => !s)}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow"
                >
                    {showForm ? '✕ Cancel' : '+ Add Medicine'}
                </button>
            </div>

            {/* Add form */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-5 space-y-4">
                    <h3 className="font-semibold text-slate-800 text-lg">New Medication</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Medicine Name *</label>
                            <input
                                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder="e.g. Metformin"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Dosage</label>
                            <input
                                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder="e.g. 500mg / 1 tablet"
                                value={form.dosage}
                                onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Frequency</label>
                        <div className="flex flex-wrap gap-2">
                            {FREQ_PRESETS.map((p, i) => (
                                <button
                                    key={i}
                                    onClick={() => setForm(f => ({ ...f, preset: i }))}
                                    className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${form.preset === i ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-700 border-slate-300 hover:border-teal-400'}`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        {form.preset === FREQ_PRESETS.length - 1 && (
                            <div className="mt-3">
                                <label className="block text-sm font-medium text-slate-600 mb-1">Custom Time</label>
                                <input type="time" className="border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    value={form.customTime} onChange={e => setForm(f => ({ ...f, customTime: e.target.value }))} />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Reminder Language</label>
                        <select
                            className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-teal-500"
                            value={form.lang}
                            onChange={e => setForm(f => ({ ...f, lang: e.target.value }))}
                        >
                            {(LANGUAGES as any).map((l: any) => (
                                <option key={l.code} value={l.code}>{l.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Notes (optional)</label>
                        <input className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="e.g. Take after meals" value={form.notes}
                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                    <button onClick={addMed} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition-colors shadow">
                        Save Medication
                    </button>
                </div>
            )}

            {/* Medication cards */}
            {meds.length === 0 && !showForm && (
                <div className="text-center py-12 text-slate-400">
                    <p className="text-5xl mb-3">💊</p>
                    <p className="text-lg font-medium">No medications added yet.</p>
                    <p className="text-sm">Tap "+ Add Medicine" to get started.</p>
                </div>
            )}

            <div className="space-y-4">
                {meds.map(med => (
                    <div key={med.id} className="bg-white rounded-2xl border border-slate-200 shadow p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <p className="text-xl font-bold text-slate-900">{med.name}</p>
                                <p className="text-sm text-slate-500">{med.dosage}{med.notes ? ` · ${med.notes}` : ''}</p>
                            </div>
                            <button onClick={() => deleteMed(med.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1" title="Delete">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                            </button>
                        </div>
                        {/* Time slots */}
                        <div className="flex flex-wrap gap-2">
                            {med.times.map(t => {
                                const log = getLog(med.id, t);
                                return (
                                    <div key={t} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                        <span className="text-sm font-mono font-semibold text-slate-700">{t}</span>
                                        {log ? (
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${log.status === 'taken' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                                {log.status === 'taken' ? '✓ Taken' : '✕ Skipped'}
                                            </span>
                                        ) : (
                                            <div className="flex gap-1">
                                                <button onClick={() => logDose(med, t, 'taken')}
                                                    className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-0.5 rounded-lg font-semibold transition-colors">
                                                    Taken
                                                </button>
                                                <button onClick={() => logDose(med, t, 'skipped')}
                                                    className="text-xs bg-slate-200 hover:bg-red-100 hover:text-red-600 text-slate-600 px-2 py-0.5 rounded-lg font-semibold transition-colors">
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

            {/* Recent log */}
            {recentLogs.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-3">📋 Recent Log</h3>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow divide-y divide-slate-100">
                        {recentLogs.map(l => (
                            <div key={l.id} className="flex items-center justify-between px-4 py-3">
                                <div>
                                    <p className="font-medium text-slate-800">{l.medicationName}</p>
                                    <p className="text-xs text-slate-400">{l.date} at {l.time}</p>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${l.status === 'taken' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                    {l.status === 'taken' ? '✓ Taken' : '✕ Skipped'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
