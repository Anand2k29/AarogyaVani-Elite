import React, { useState } from 'react';
import { MedicationReminders } from './MedicationReminders';
import { AppointmentCalendar } from './AppointmentCalendar';
import { SOSPanel } from './SOSPanel';
import { CaregiverDashboard } from './CaregiverDashboard';

type Tab = 'meds' | 'appts' | 'sos' | 'caregiver';

const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'meds', label: 'Medicines', icon: '💊' },
    { id: 'appts', label: 'Appts', icon: '📅' },
    { id: 'sos', label: 'SOS', icon: '🆘' },
    { id: 'caregiver', label: 'Family', icon: '👨‍👩‍👧' },
];

export const ElderlyCompanion: React.FC = () => {
    const [tab, setTab] = useState<Tab>('meds');

    return (
        <div className="w-full max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Welcome banner - Retro-Futurist Premium */}
            <div className="relative overflow-hidden rounded-[3rem] bg-teal-950 p-10 text-white shadow-[0_32px_64px_rgba(0,28,24,0.4)] border-2 border-yellow-400/20">
                <div className="relative z-10 space-y-2">
                    <h2 className="text-4xl font-serif font-black tracking-tighter italic">Neural Companion</h2>
                    <p className="text-yellow-400 font-black tracking-widest text-[10px] uppercase opacity-80">Local Intelligence Node • Secured</p>
                </div>
                {/* Decorative gold glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl -mr-24 -mt-24 animate-pulse"></div>
            </div>

            {/* Inner tab bar - Glossy Retro */}
            <div className="flex p-2 gap-2 rounded-[2.5rem] bg-black/40 border-2 border-white/5 backdrop-blur-3xl shadow-2xl">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex-1 flex flex-col items-center justify-center gap-2 py-5 px-2 rounded-2xl transition-all duration-500
              ${tab === t.id
                                ? 'bg-yellow-400 text-teal-950 shadow-[0_15px_30px_rgba(250,204,21,0.2)] scale-[1.05] border-b-4 border-yellow-600'
                                : 'text-slate-600 hover:text-yellow-400 hover:bg-white/5 border-b-4 border-transparent'
                            }`}
                    >
                        <span className="text-2xl filter group-hover:drop-shadow-lg transition-all">{t.icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t.label}</span>
                    </button>
                ))}
            </div>

            {/* Panel with Glassmorphism */}
            <div className="min-h-[450px] animate-in fade-in duration-500">
                {tab === 'meds' && <MedicationReminders />}
                {tab === 'appts' && <AppointmentCalendar />}
                {tab === 'sos' && <SOSPanel />}
                {tab === 'caregiver' && <CaregiverDashboard />}
            </div>
        </div>
    );
};
