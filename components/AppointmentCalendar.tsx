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

    // Calendar grid
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">📅 Appointments</h2>
                <button onClick={() => setShowForm(s => !s)}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow">
                    {showForm ? '✕ Cancel' : '+ Add Appointment'}
                </button>
            </div>

            {/* Add form */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-5 space-y-4">
                    <h3 className="font-semibold text-slate-800 text-lg">New Appointment</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Title *</label>
                            <input className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder="e.g. Cardiology Check-up" value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Doctor</label>
                            <input className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder="Dr. Sharma" value={form.doctor}
                                onChange={e => setForm(f => ({ ...f, doctor: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Date *</label>
                            <input type="date" className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Time *</label>
                            <input type="time" className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Location</label>
                        <input className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Apollo Hospital, Room 203" value={form.location}
                            onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                    </div>
                    <button onClick={addAppt} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition-colors shadow">
                        Save Appointment
                    </button>
                </div>
            )}

            {/* Calendar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow p-5">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">‹</button>
                    <h3 className="font-bold text-slate-900 text-lg">{MONTH_NAMES[month]} {year}</h3>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">›</button>
                </div>
                <div className="grid grid-cols-7 text-center mb-2">
                    {DAY_NAMES.map(d => (
                        <div key={d} className="text-xs font-semibold text-slate-400 py-1">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                        const isToday = dateStr === today;
                        const hasAppt = apptDateSet.has(dateStr);
                        const isSelected = dateStr === selectedDate;
                        return (
                            <button key={dayNum} onClick={() => setSelectedDate(s => s === dateStr ? null : dateStr)}
                                className={`relative aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-colors
                  ${isToday ? 'bg-teal-600 text-white' : ''}
                  ${isSelected && !isToday ? 'bg-teal-100 text-teal-800 ring-2 ring-teal-400' : ''}
                  ${!isToday && !isSelected ? 'hover:bg-slate-100 text-slate-700' : ''}
                `}>
                                {dayNum}
                                {hasAppt && (
                                    <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-teal-500'}`} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Appointments on selected date */}
            {selectedDate && (
                <div>
                    <h3 className="text-base font-semibold text-slate-700 mb-2">{selectedDate}</h3>
                    {apptForSelected.length === 0 ? (
                        <p className="text-slate-400 text-sm">No appointments on this day.</p>
                    ) : (
                        <div className="space-y-2">
                            {apptForSelected.map(a => (
                                <ApptCard key={a.id} appt={a} onDelete={deleteAppt} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Upcoming */}
            <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-3">🗓 Upcoming</h3>
                {upcoming.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-6">No upcoming appointments.</p>
                ) : (
                    <div className="space-y-2">
                        {upcoming.map(a => <ApptCard key={a.id} appt={a} onDelete={deleteAppt} />)}
                    </div>
                )}
            </div>
        </div>
    );
};

const ApptCard: React.FC<{ appt: Appointment; onDelete: (id: string) => void }> = ({ appt, onDelete }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 truncate">{appt.title}</p>
            <p className="text-sm text-teal-600 font-medium">{appt.date} at {appt.time}</p>
            {appt.doctor && <p className="text-xs text-slate-500">👤 {appt.doctor}</p>}
            {appt.location && <p className="text-xs text-slate-500">📍 {appt.location}</p>}
        </div>
        <button onClick={() => onDelete(appt.id)} className="text-slate-300 hover:text-red-500 transition-colors mt-0.5" title="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    </div>
);
