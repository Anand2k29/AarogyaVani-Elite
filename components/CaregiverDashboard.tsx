import React, { useState } from 'react';
import { Medication, MedLog, Appointment, EmergencyContact } from '../types';

const LS = {
    meds: 'av_medications',
    logs: 'av_med_logs',
    appts: 'av_appointments',
    contacts: 'av_emergency_contacts',
};

function load<T>(key: string, fallback: T): T {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
    catch { return fallback; }
}

function todayStr() { return new Date().toISOString().split('T')[0]; }

export const CaregiverDashboard: React.FC = () => {
    const meds: Medication[] = load(LS.meds, []);
    const logs: MedLog[] = load(LS.logs, []);
    const appts: Appointment[] = load(LS.appts, []);
    const contacts: EmergencyContact[] = load(LS.contacts, []);

    const [copied, setCopied] = useState(false);

    const today = todayStr();
    const todaysLogs = logs.filter(l => l.date === today);
    const takenToday = todaysLogs.filter(l => l.status === 'taken').length;
    const skippedToday = todaysLogs.filter(l => l.status === 'skipped').length;
    const totalDosesToday = meds.reduce((s, m) => s + m.times.length, 0);

    const upcomingAppts = appts.filter(a => a.date >= today).slice(0, 5);

    const recentLogs = [...logs]
        .sort((a, b) => b.loggedAt - a.loggedAt)
        .slice(0, 7);

    const buildSummary = () => {
        const lines: string[] = [`📋 AarogyaVani Care Summary — ${today}`, ''];
        lines.push(`💊 Medications Today: ${takenToday} taken, ${skippedToday} skipped (of ${totalDosesToday} doses)`);
        if (meds.length > 0) {
            lines.push('  Medicines:');
            meds.forEach(m => lines.push(`  • ${m.name} ${m.dosage} at ${m.times.join(', ')}`));
        }
        lines.push('');
        if (upcomingAppts.length > 0) {
            lines.push('📅 Upcoming Appointments:');
            upcomingAppts.forEach(a => lines.push(`  • ${a.date} ${a.time} — ${a.title}${a.doctor ? ` (${a.doctor})` : ''}`));
        } else {
            lines.push('📅 No upcoming appointments.');
        }
        lines.push('');
        if (contacts.length > 0) {
            lines.push('🆘 Emergency Contacts:');
            contacts.forEach(c => lines.push(`  • ${c.name}${c.relation ? ` (${c.relation})` : ''}: ${c.phone}`));
        }
        return lines.join('\n');
    };

    const shareSummary = async () => {
        const text = buildSummary();
        if (navigator.share) {
            try { await navigator.share({ title: 'AarogyaVani Care Summary', text }); return; } catch { }
        }
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const adherence = totalDosesToday === 0 ? null : Math.round((takenToday / totalDosesToday) * 100);

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-4xl sm:text-5xl font-serif font-black tracking-tighter text-white italic">Neural Surveillance</h2>
                <button onClick={shareSummary}
                    className="flex items-center gap-3 bg-yellow-400 hover:bg-yellow-300 text-teal-950 text-[11px] font-black uppercase tracking-widest px-6 py-4 rounded-2xl transition-all shadow-xl active:scale-95 border-b-4 border-yellow-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                    </svg>
                    {copied ? 'Buffer Copied!' : 'Export Intelligence Manifest'}
                </button>
            </div>

            {/* KPI Cards - Retro Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <StatCard label="Live Molecules" value={meds.length.toString()} icon="💊" color="emerald" />
                <StatCard label="Phase Sync" value={adherence !== null ? `${adherence}%` : '--'}
                    icon="📊" color={adherence === null ? 'slate' : adherence >= 80 ? 'green' : adherence >= 50 ? 'yellow' : 'red'} />
                <StatCard label="Visit Protocols" value={upcomingAppts.length.toString()} icon="📅" color="blue" />
                <StatCard label="SOS Matrix" value={contacts.length.toString()} icon="🆘" color="red" />
            </div>

            {/* Today's medication status - Retro-Futurist Matrix */}
            <div className="bg-black/30 rounded-[3.5rem] border-2 border-white/5 shadow-2xl p-10 backdrop-blur-3xl relative overflow-hidden">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Life-Cycle Adherence Matrix</h3>
                </div>
                {meds.length === 0 ? (
                    <div className="py-20 text-center opacity-20">
                        <p className="text-7xl mb-6">💊</p>
                        <p className="text-xl font-serif font-black uppercase tracking-tight italic text-slate-500">No telemetry detected</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {meds.map(m => {
                            const medLogs = todaysLogs.filter(l => l.medicationId === m.id);
                            return (
                                <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-6 border-b border-white/5 last:border-0 hover:bg-yellow-400/5 transition-all rounded-3xl px-6 group">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-serif font-black text-3xl text-white tracking-tight uppercase italic group-hover:text-yellow-400 transition-colors leading-none mb-1">{m.name}</p>
                                        <p className="text-[10px] font-black text-yellow-400/60 uppercase tracking-[0.3em]">{m.dosage}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 flex-shrink-0">
                                        {m.times.map(t => {
                                            const log = medLogs.find(l => l.time === t);
                                            return (
                                                <span key={t} className={`text-[10px] px-4 py-2 rounded-xl font-black uppercase tracking-widest transition-all border-2
                          ${log?.status === 'taken' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' :
                                                        log?.status === 'skipped' ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' :
                                                            'bg-black/40 text-slate-600 border-white/5'}`}>
                                                    {t} {log?.status === 'taken' ? '✓' : log?.status === 'skipped' ? '✕' : '·'}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-[100px] pointer-events-none"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upcoming appointments */}
                <div className="glass bg-black/20 rounded-[3.5rem] border-2 border-white/5 p-10 space-y-10">
                    <h3 className="text-2xl font-serif font-black text-white tracking-tight uppercase px-2 italic">Upcoming Milestones</h3>
                    {upcomingAppts.length === 0 ? (
                        <p className="text-slate-700 font-black uppercase tracking-[0.3em] text-[10px] text-center py-20 italic">Timeline Purged</p>
                    ) : (
                        <div className="space-y-4">
                            {upcomingAppts.map(a => (
                                <div key={a.id} className="flex items-start gap-5 p-6 rounded-3xl bg-black/40 border border-white/5 hover:border-yellow-400/20 transition-all group">
                                    <span className="text-4xl filter grayscale group-hover:grayscale-0 transition-all">{a.date === today ? '📌' : '📅'}</span>
                                    <div className="space-y-1">
                                        <p className="font-serif font-black text-white uppercase tracking-tight text-2xl leading-none italic group-hover:text-yellow-400 transition-colors">{a.title}</p>
                                        <p className="text-[10px] font-black text-yellow-400/60 uppercase tracking-widest">{a.date} @ {a.time}</p>
                                        {(a.doctor || a.location) && (
                                            <div className="flex items-center gap-3 pt-4 border-t border-white/5 mt-4 group-hover:border-yellow-400/10">
                                                {a.doctor && <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 pr-3 border-r border-white/10 italic">Officer {a.doctor}</span>}
                                                {a.location && <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 italic">Loc: {a.location}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent logs */}
                <div className="glass bg-black/20 rounded-[3.5rem] border-2 border-white/5 p-10 space-y-10">
                    <h3 className="text-2xl font-serif font-black text-white tracking-tight uppercase px-2 italic">Tactical History</h3>
                    {recentLogs.length === 0 ? (
                        <p className="text-slate-700 font-black uppercase tracking-[0.3em] text-[10px] text-center py-20 italic">Registry Empty</p>
                    ) : (
                        <div className="space-y-4">
                            {recentLogs.map(l => (
                                <div key={l.id} className="flex items-center justify-between p-6 rounded-3xl bg-black/40 border border-white/5 hover:border-yellow-400/20 transition-all group">
                                    <div className="space-y-1">
                                        <p className="font-serif font-black text-white uppercase tracking-tight text-2xl leading-none italic group-hover:text-yellow-400 transition-colors">{l.medicationName}</p>
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{l.date} @ {l.time}</p>
                                    </div>
                                    <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 shadow-inner ${l.status === 'taken' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' : 'bg-red-500/10 text-red-400 border-red-500/10'}`}>
                                        {l.status === 'taken' ? '✓ Taken' : '✕ Missed'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Emergency Alert Section - Retro Red */}
            {contacts.length > 0 && (
                <div className="rounded-[4rem] border-2 border-red-500/30 bg-red-600/5 p-12 space-y-10 relative overflow-hidden group shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]"></div>
                        <h3 className="text-2xl font-serif font-black text-red-500 uppercase tracking-tight italic">Escalation Directory</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                        {contacts.map((c, i) => (
                            <div key={c.id} className="flex items-center gap-6 bg-black/40 border-2 border-white/5 rounded-[2.5rem] p-6 hover:border-red-500/30 transition-all group/card">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl flex-shrink-0 shadow-2xl transition-all group-hover/card:scale-110 ${i === 0 ? 'bg-red-600 border-b-4 border-red-800' : 'bg-slate-800 border-b-4 border-slate-950'}`}>
                                    {c.name[0].toUpperCase()}
                                </div>
                                <div className="space-y-1 truncate">
                                    <p className="text-2xl font-serif font-black text-white tracking-tight uppercase italic truncate">{c.name}{c.relation ? ` (${c.relation})` : ''}</p>
                                    <a href={`tel:${c.phone}`} className="text-[11px] font-black text-yellow-500/60 hover:text-yellow-400 transition-colors uppercase tracking-widest">{c.phone}</a>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
                </div>
            )}
        </div>
    );
};

const StatCard: React.FC<{ label: string; value: string; icon: string; color: string }> = ({ label, value, icon, color }) => {
    const colorStyles: Record<string, string> = {
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        yellow: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
        red: 'bg-red-500/10 text-red-400 border-red-500/20',
        blue: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        slate: 'bg-white/5 text-slate-500 border-white/10',
    };

    return (
        <div className={`glass bg-black/40 rounded-[3rem] p-10 text-center transition-all duration-700 hover:-translate-y-2 group border-2 ${colorStyles[color] ?? colorStyles.slate}`}>
            <p className="text-5xl mb-6 filter drop-shadow-lg scale-110 transition-transform group-hover:scale-125 leading-none">{icon}</p>
            <p className="text-5xl font-serif font-black tracking-tight text-white mb-3 italic">{value}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 leading-none">{label}</p>
        </div>
    );
};
