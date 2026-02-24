import React, { useState, useEffect, useCallback } from 'react';
import { Appointment } from '../types';

const LS_APPTS = 'av_appointments';

function load<T>(key: string, fallback: T): T {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
    catch { return fallback; }
}
function save(key: string, value: unknown) { localStorage.setItem(key, JSON.stringify(value)); }
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function todayStr() { return new Date().toISOString().split('T')[0]; }

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const AppointmentCalendar: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>(() => load(LS_APPTS, []));
    const [viewDate, setViewDate] = useState(new Date());
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', doctor: '', location: '', date: todayStr(), time: '10:00', notes: '' });

    useEffect(() => { save(LS_APPTS, appointments); }, [appointments]);

    const addAppt = useCallback(() => {
        if (!form.title.trim() || !form.date || !form.time) return;
        const appt: Appointment = {
            id: uid(), title: form.title.trim(),
            doctor: form.doctor.trim() || undefined,
            location: form.location.trim() || undefined,
            date: form.date, time: form.time,
            notes: form.notes.trim() || undefined,
        };
        setAppointments(p => [...p, appt].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)));
        setForm({ title: '', doctor: '', location: '', date: todayStr(), time: '10:00', notes: '' });
        setShowForm(false);
    }, [form]);

    const deleteAppt = useCallback((id: string) => {
        setAppointments(p => p.filter(a => a.id !== id));
    }, []);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = todayStr();

    const apptDateSet = new Set(appointments.map(a => a.date));

    const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const apptForSelected = appointments.filter(a => a.date === selectedDate);
    const upcoming = appointments.filter(a => a.date >= today).slice(0, 5);

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-4xl sm:text-5xl font-serif font-black tracking-tighter text-white italic">Clinical Registry</h2>
                <button onClick={() => setShowForm(s => !s)}
                    className="bg-yellow-400 hover:bg-yellow-300 text-teal-950 text-[11px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl transition-all shadow-xl active:scale-95 border-b-4 border-yellow-600">
                    {showForm ? '✕ Close' : '+ New Schedule'}
                </button>
            </div>

            {/* Add form - Retro-Futurist */}
            {showForm && (
                <div className="bg-teal-950/40 rounded-[3rem] border-2 border-yellow-400/30 shadow-[0_32px_64px_rgba(0,0,0,0.5)] p-10 space-y-8 backdrop-blur-3xl animate-in slide-in-from-top-8 duration-500">
                    <h3 className="font-serif font-black text-yellow-400 text-3xl tracking-tight uppercase italic">Secure Appointment Init</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-yellow-400/60 uppercase tracking-[0.25em]">Consultation Title</label>
                            <input className="w-full bg-black/40 border-2 border-white/10 rounded-2xl px-5 py-4 text-white font-bold text-lg focus:outline-none focus:border-yellow-400 transition-all placeholder:text-slate-700"
                                placeholder="e.g. CARDIOVASCULAR REVIEW" value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-yellow-400/60 uppercase tracking-[0.25em]">Medical Officer</label>
                            <input className="w-full bg-black/40 border-2 border-white/10 rounded-2xl px-5 py-4 text-white font-bold text-lg focus:outline-none focus:border-yellow-400 transition-all placeholder:text-slate-700"
                                placeholder="DR. VIKRAM" value={form.doctor}
                                onChange={e => setForm(f => ({ ...f, doctor: e.target.value }))} />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-yellow-400/60 uppercase tracking-[0.25em]">Target Date</label>
                            <input type="date" className="w-full bg-black/40 border-2 border-white/10 rounded-2xl px-5 py-4 text-white font-bold text-lg focus:outline-none focus:border-yellow-400 transition-all [color-scheme:dark]"
                                value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-yellow-400/60 uppercase tracking-[0.25em]">Arrival Window</label>
                            <input type="time" className="w-full bg-black/40 border-2 border-white/10 rounded-2xl px-5 py-4 text-white font-bold text-lg focus:outline-none focus:border-yellow-400 transition-all [color-scheme:dark]"
                                value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-yellow-400/60 uppercase tracking-[0.25em]">Facility Location</label>
                        <input className="w-full bg-black/40 border-2 border-white/10 rounded-2xl px-5 py-4 text-white font-bold text-lg focus:outline-none focus:border-yellow-400 transition-all placeholder:text-slate-700"
                            placeholder="AIIMS REGIONAL TERMINAL" value={form.location}
                            onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                    </div>
                    <button onClick={addAppt} className="w-full bg-yellow-400 hover:bg-yellow-300 text-teal-950 font-black py-6 rounded-2xl transition-all shadow-2xl active:scale-95 text-2xl tracking-tighter uppercase border-b-4 border-yellow-600">
                        Commit Protocol to Registry
                    </button>
                </div>
            )}

            {/* Calendar - Retro-Futurist */}
            <div className="bg-black/30 rounded-[3.5rem] border-2 border-white/5 shadow-2xl p-10 backdrop-blur-3xl overflow-hidden relative">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={prevMonth} className="w-12 h-12 flex items-center justify-center hover:bg-yellow-400 text-white hover:text-teal-950 rounded-xl transition-all font-black text-2xl active:scale-75 select-none border border-white/10">‹</button>
                    <h3 className="font-serif font-black text-white text-3xl tracking-tighter uppercase italic">{MONTH_NAMES[month]} {year}</h3>
                    <button onClick={nextMonth} className="w-12 h-12 flex items-center justify-center hover:bg-yellow-400 text-white hover:text-teal-950 rounded-xl transition-all font-black text-2xl active:scale-75 select-none border border-white/10">›</button>
                </div>
                <div className="grid grid-cols-7 text-center mb-6">
                    {DAY_NAMES.map(d => (
                        <div key={d} className="text-[10px] font-black text-yellow-400/40 py-1 uppercase tracking-[0.3em] italic">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-4">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                        const isToday = dateStr === today;
                        const hasAppt = apptDateSet.has(dateStr);
                        const isSelected = dateStr === selectedDate;
                        return (
                            <button key={dayNum} onClick={() => setSelectedDate(s => s === dateStr ? null : dateStr)}
                                className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl text-xl font-black transition-all duration-300 border-2
                  ${isToday ? 'bg-yellow-400 text-teal-950 border-yellow-500 shadow-[0_0_30px_rgba(250,204,21,0.3)] scale-110 z-10' : ''}
                  ${isSelected && !isToday ? 'bg-white/20 text-white border-yellow-400 shadow-xl scale-105' : ''}
                  ${!isToday && !isSelected ? 'bg-black/20 border-white/5 hover:border-white/20 text-slate-500 hover:text-white' : ''}
                `}>
                                {dayNum}
                                {hasAppt && (
                                    <span className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isToday ? 'bg-teal-950' : 'bg-yellow-400'} shadow-[0_0_10px_rgba(250,204,21,1)]`} />
                                )}
                            </button>
                        );
                    })}
                </div>
                <div className="absolute top-0 left-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-[100px] pointer-events-none"></div>
            </div>

            {/* Selected Date Details */}
            {selectedDate && (
                <div className="animate-in slide-in-from-left-6 duration-500">
                    <h3 className="text-[11px] font-black text-yellow-400 mb-6 uppercase tracking-[0.4em] italic leading-none">Manifest for {selectedDate}</h3>
                    {apptForSelected.length === 0 ? (
                        <div className="p-10 rounded-[2.5rem] bg-black/20 border-2 border-dashed border-white/5 text-center">
                            <p className="text-slate-700 font-black uppercase tracking-[0.3em] text-[10px]">Zero Protocols Logged for this Date</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {apptForSelected.map(a => (
                                <ApptCard key={a.id} appt={a} onDelete={deleteAppt} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Upcoming Feed */}
            <div className="space-y-8 pt-6 animate-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Temporal Health Milestones</h3>
                </div>
                {upcoming.length === 0 ? (
                    <div className="py-24 bg-teal-950/20 rounded-[4rem] border-2 border-dashed border-white/5 text-center space-y-4">
                        <p className="text-7xl grayscale opacity-20">📭</p>
                        <p className="text-2xl font-serif font-black text-slate-700 uppercase tracking-tight italic leading-none">Status: All Clear</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {upcoming.map(a => <ApptCard key={a.id} appt={a} onDelete={deleteAppt} />)}
                    </div>
                )}
            </div>
        </div>
    );
};

const ApptCard: React.FC<{ appt: Appointment; onDelete: (id: string) => void }> = ({ appt, onDelete }) => (
    <div className="group glass bg-black/30 border-white/5 rounded-[2.5rem] p-8 flex items-start justify-between gap-6 transition-all duration-500 hover:bg-teal-900/20 hover:-translate-y-1 relative overflow-hidden">
        <div className="flex-1 min-w-0 space-y-6 relative z-10">
            <div className="space-y-2">
                <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] opacity-60 italic">Node Target: {appt.id.slice(-6).toUpperCase()}</p>
                <p className="text-4xl font-serif font-black text-white tracking-tight truncate leading-none uppercase italic">{appt.title}</p>
            </div>
            <div className="flex flex-wrap gap-3">
                <div className="bg-yellow-400/10 text-yellow-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-yellow-400/20">
                    ⏰ {appt.time}
                </div>
                <div className="bg-white/5 text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">
                    📅 {appt.date}
                </div>
            </div>
            <div className="flex flex-col gap-3 pt-2">
                {appt.doctor && <p className="text-sm font-black text-slate-300 flex items-center gap-4">
                    <span className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[10px] border border-indigo-500/20">M.O.</span>
                    {appt.doctor}
                </p>}
                {appt.location && <p className="text-sm font-black text-slate-300 flex items-center gap-4">
                    <span className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] border border-emerald-500/20">FAC.</span>
                    {appt.location}
                </p>}
            </div>
        </div>
        <button onClick={() => onDelete(appt.id)} className="p-4 text-slate-700 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 relative z-10" title="Purge Node">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
    </div>
);
