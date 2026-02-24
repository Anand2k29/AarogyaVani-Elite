import React, { useState } from 'react';
import { MedicationReminders } from './MedicationReminders';
import { AppointmentCalendar } from './AppointmentCalendar';
import { SOSPanel } from './SOSPanel';
import { CaregiverDashboard } from './CaregiverDashboard';

type Tab = 'meds' | 'appts' | 'sos' | 'caregiver';

const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'meds', label: 'Medicines', icon: '💊' },
    { id: 'appts', label: 'Appointments', icon: '📅' },
    { id: 'sos', label: 'SOS', icon: '🆘' },
    { id: 'caregiver', label: 'Caregiver', icon: '👨‍👩‍👧' },
];

export const ElderlyCompanion: React.FC = () => {
    const [tab, setTab] = useState<Tab>('meds');

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Welcome banner */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl p-5 text-white shadow-lg">
                <h2 className="text-2xl font-extrabold">Care Companion 👴</h2>
                <p className="text-teal-100 text-sm mt-1">Your daily health assistant — works fully offline.</p>
            </div>

            {/* Inner tab bar */}
            <div className="grid grid-cols-4 bg-slate-100 rounded-2xl p-1 gap-1">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl text-xs font-semibold transition-all
              ${tab === t.id
                                ? 'bg-white text-teal-700 shadow'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <span className="text-lg">{t.icon}</span>
                        <span className="leading-tight text-center">{t.label}</span>
                    </button>
                ))}
            </div>

            {/* Panel */}
            <div>
                {tab === 'meds' && <MedicationReminders />}
                {tab === 'appts' && <AppointmentCalendar />}
                {tab === 'sos' && <SOSPanel />}
                {tab === 'caregiver' && <CaregiverDashboard />}
            </div>
        </div>
    );
};
