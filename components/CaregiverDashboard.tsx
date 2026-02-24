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
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-2xl font-bold text-slate-900">👨‍👩‍👧 Caregiver Overview</h2>
                <button onClick={shareSummary}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                    </svg>
                    {copied ? 'Copied!' : 'Share Summary'}
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Medications" value={meds.length.toString()} icon="💊" color="teal" />
                <StatCard label="Adherence Today" value={adherence !== null ? `${adherence}%` : 'N/A'}
                    icon="✅" color={adherence === null ? 'slate' : adherence >= 80 ? 'green' : adherence >= 50 ? 'yellow' : 'red'} />
                <StatCard label="Upcoming Appts" value={upcomingAppts.length.toString()} icon="📅" color="blue" />
                <StatCard label="SOS Contacts" value={contacts.length.toString()} icon="🆘" color="red" />
            </div>

            {/* Today's medication status */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow p-5">
                <h3 className="font-semibold text-slate-800 text-base mb-4">💊 Today's Medications ({today})</h3>
                {meds.length === 0 ? (
                    <p className="text-slate-400 text-sm">No medications set up yet.</p>
                ) : (
                    <div className="space-y-3">
                        {meds.map(m => {
                            const medLogs = todaysLogs.filter(l => l.medicationId === m.id);
                            return (
                                <div key={m.id} className="flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 truncate">{m.name}</p>
                                        <p className="text-xs text-slate-400">{m.dosage} · {m.times.join(', ')}</p>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                        {m.times.map(t => {
                                            const log = medLogs.find(l => l.time === t);
                                            return (
                                                <span key={t} className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${log?.status === 'taken' ? 'bg-green-100 text-green-700' :
                                                        log?.status === 'skipped' ? 'bg-red-100 text-red-600' :
                                                            'bg-slate-100 text-slate-400'}`}>
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
            </div>

            {/* Upcoming appointments */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow p-5">
                <h3 className="font-semibold text-slate-800 text-base mb-4">📅 Upcoming Appointments</h3>
                {upcomingAppts.length === 0 ? (
                    <p className="text-slate-400 text-sm">No upcoming appointments.</p>
                ) : (
                    <div className="space-y-2">
                        {upcomingAppts.map(a => (
                            <div key={a.id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                                <span className="text-2xl">{a.date === today ? '📌' : '📅'}</span>
                                <div>
                                    <p className="font-medium text-slate-900">{a.title}</p>
                                    <p className="text-xs text-teal-600">{a.date} at {a.time}</p>
                                    {a.doctor && <p className="text-xs text-slate-400">👤 {a.doctor}</p>}
                                    {a.location && <p className="text-xs text-slate-400">📍 {a.location}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent log */}
            {recentLogs.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow p-5">
                    <h3 className="font-semibold text-slate-800 text-base mb-4">📋 Recent Activity</h3>
                    <div className="divide-y divide-slate-100">
                        {recentLogs.map(l => (
                            <div key={l.id} className="flex items-center justify-between py-2">
                                <div>
                                    <p className="text-sm font-medium text-slate-800">{l.medicationName}</p>
                                    <p className="text-xs text-slate-400">{l.date} at {l.time}</p>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                  ${l.status === 'taken' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                    {l.status === 'taken' ? '✓ Taken' : '✕ Skipped'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Emergency contacts */}
            {contacts.length > 0 && (
                <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
                    <h3 className="font-semibold text-red-800 text-base mb-3">🆘 Emergency Contacts</h3>
                    <div className="space-y-2">
                        {contacts.map(c => (
                            <div key={c.id} className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    {c.name[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{c.name}{c.relation ? ` (${c.relation})` : ''}</p>
                                    <a href={`tel:${c.phone}`} className="text-xs text-teal-600 hover:underline">{c.phone}</a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const colorMap: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
};

const StatCard: React.FC<{ label: string; value: string; icon: string; color: string }> = ({ label, value, icon, color }) => (
    <div className={`rounded-2xl border p-4 text-center ${colorMap[color] ?? colorMap.slate}`}>
        <p className="text-2xl mb-1">{icon}</p>
        <p className="text-2xl font-extrabold">{value}</p>
        <p className="text-xs font-medium opacity-80">{label}</p>
    </div>
);
