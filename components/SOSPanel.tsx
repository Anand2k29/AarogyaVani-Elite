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
        // Haptic feedback
        if ('vibrate' in navigator) navigator.vibrate([300, 100, 300, 100, 300]);
        // Call first contact
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
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">🆘 Emergency SOS</h2>

            {/* Big SOS Button */}
            <div className="flex flex-col items-center py-8 space-y-4">
                <p className="text-slate-500 text-sm text-center max-w-xs">
                    Press the SOS button in an emergency. It will immediately call your primary emergency contact.
                </p>
                <button
                    onClick={triggerSOS}
                    className={`relative w-44 h-44 rounded-full font-black text-3xl text-white shadow-2xl transition-all active:scale-95 focus:outline-none
            ${sosActive
                            ? 'bg-red-700 scale-95 animate-pulse'
                            : 'bg-red-600 hover:bg-red-700 hover:scale-105'
                        }`}
                    aria-label="SOS Emergency Button"
                >
                    <span className="relative z-10">SOS</span>
                    {sosActive && (
                        <span className="absolute inset-0 rounded-full bg-red-400 opacity-40 animate-ping" />
                    )}
                </button>
                {sosActive && (
                    <p className="text-red-600 font-semibold animate-pulse text-lg">📞 Calling {contacts[0]?.name}…</p>
                )}
            </div>

            {/* Emergency Contacts */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-700">Emergency Contacts ({contacts.length}/3)</h3>
                    {contacts.length < 3 && (
                        <button onClick={() => setShowForm(s => !s)}
                            className="text-sm bg-slate-900 hover:bg-slate-700 text-white font-semibold px-3 py-1.5 rounded-xl transition-colors">
                            {showForm ? '✕ Cancel' : '+ Add Contact'}
                        </button>
                    )}
                </div>

                {/* Add form */}
                {showForm && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-5 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Name *</label>
                                <input className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-red-400"
                                    placeholder="e.g. Rahul (Son)" value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Phone number *</label>
                                <input type="tel" className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-red-400"
                                    placeholder="+91 98765 43210" value={form.phone}
                                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-slate-600 mb-1">Relation (optional)</label>
                                <input className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-red-400"
                                    placeholder="Son / Daughter / Neighbour / Doctor" value={form.relation}
                                    onChange={e => setForm(f => ({ ...f, relation: e.target.value }))} />
                            </div>
                        </div>
                        <button onClick={addContact}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors shadow">
                            Save Contact
                        </button>
                    </div>
                )}

                {contacts.length === 0 && !showForm && (
                    <div className="text-center py-8 text-slate-400 bg-white rounded-2xl border border-slate-200">
                        <p className="text-4xl mb-2">👥</p>
                        <p className="font-medium">No emergency contacts yet.</p>
                        <p className="text-sm">Add up to 3 contacts for the SOS button.</p>
                    </div>
                )}

                {contacts.map((c, i) => (
                    <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow flex items-center gap-4 px-4 py-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0
              ${i === 0 ? 'bg-red-500' : 'bg-slate-500'}`}>
                            {i === 0 ? '1st' : i === 1 ? '2nd' : '3rd'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900">{c.name}</p>
                            {c.relation && <p className="text-xs text-slate-400">{c.relation}</p>}
                            <a href={`tel:${c.phone}`} className="text-teal-600 text-sm font-medium hover:underline">{c.phone}</a>
                        </div>
                        <button onClick={() => deleteContact(c.id)} className="text-slate-300 hover:text-red-500 transition-colors" title="Remove">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}

                {contacts.length > 0 && (
                    <button onClick={shareContacts}
                        className="w-full py-2.5 border border-slate-300 hover:border-teal-400 text-slate-600 hover:text-teal-700 text-sm font-medium rounded-xl transition-colors">
                        {copied ? '✓ Copied to clipboard!' : '📋 Copy contacts to clipboard'}
                    </button>
                )}
            </div>
        </div>
    );
};
