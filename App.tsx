import React, { useState, useRef, useEffect } from 'react';
import { analyzePrescription } from './services/geminiService';
import { AarogyaResponse, Medicine } from './types';
import { PillIcon, CameraIcon, LoadingSpinner, CheckCircleIcon, XCircleIcon, ShareIcon, PlayIcon } from './components/Icons';
import { ElderlyCompanion } from './components/ElderlyCompanion';
import { SUPPORTED_LANGUAGES, TTS_LOCALE_MAP } from './constants';

type AppState = 'IDLE' | 'ANALYZING' | 'SUCCESS' | 'ERROR';
type MainTab = 'scanner' | 'companion';

const App: React.FC = () => {
  const [mainTab, setMainTab] = useState<MainTab>('scanner');
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [response, setResponse] = useState<AarogyaResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState('hi'); // Default to Hindi
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setAppState('ANALYZING');
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const data = await analyzePrescription(base64, selectedLang);
        setResponse(data);
        setAppState('SUCCESS');

        // Auto-play success message
        speak(data.success_message || "Prescription read successfully.");
      } catch (err: any) {
        setAppState('ERROR');
        setErrorMsg(err?.message || 'Failed to analyze prescription.');
      }
    };
    reader.readAsDataURL(file);
  };

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = TTS_LOCALE_MAP[selectedLang] || 'en-IN';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const reset = () => {
    setAppState('IDLE');
    setResponse(null);
    setPreviewUrl(null);
    setErrorMsg(null);
    window.speechSynthesis.cancel();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => { setMainTab('scanner'); reset(); }}>
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white">
              <PillIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Aarogya<span className="text-teal-600">Vani</span>
            </h1>
          </div>

          {/* Top-level tab switcher */}
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => { setMainTab('scanner'); reset(); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${mainTab === 'scanner'
                ? 'bg-white text-teal-700 shadow'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              📷 Scanner
            </button>
            <button
              onClick={() => setMainTab('companion')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${mainTab === 'companion'
                ? 'bg-white text-teal-700 shadow'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              👵 Companion
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow flex flex-col items-center justify-start p-4 sm:p-8">

        {/* ── Companion Tab ── */}
        {mainTab === 'companion' && <ElderlyCompanion />}

        {/* ── Prescription Scanner Tab ── */}
        {mainTab === 'scanner' && (
          <div className="w-full max-w-2xl space-y-6">

            {/* IDLE */}
            {appState === 'IDLE' && (
              <div className="space-y-8 text-center py-8">
                <div className="space-y-3">
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                    Your Personal <br />
                    <span className="text-teal-600">Voice Companion.</span>
                  </h2>
                  <p className="text-lg text-slate-500 max-w-md mx-auto">
                    Scan your handwritten prescription and hear the instructions in your native language.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200">
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Select Your Language</label>
                    <div className="grid grid-cols-3 gap-2">
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => setSelectedLang(lang.code)}
                          className={`px-2 py-2 rounded-xl text-xs font-bold border transition-all ${selectedLang === lang.code ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'}`}
                        >
                          {lang.nativeName}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="group flex flex-col items-center justify-center gap-3 w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-8 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                  >
                    <div className="bg-white/20 p-4 rounded-full">
                      <CameraIcon className="w-10 h-10" />
                    </div>
                    <span className="text-xl">Scan Prescription</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </button>
                </div>
              </div>
            )}

            {/* ANALYZING */}
            {appState === 'ANALYZING' && (
              <div className="flex flex-col items-center space-y-8 py-12 text-center">
                <div className="relative">
                  {previewUrl && (
                    <img src={previewUrl} alt="Scan preview" className="w-48 h-64 object-cover rounded-2xl shadow-2xl grayscale blur-[2px]" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-full shadow-2xl">
                      <LoadingSpinner className="w-12 h-12 text-teal-600" />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Deciphering Prescription…</h3>
                  <p className="text-slate-500 mt-2 animate-pulse">Expanding abbreviations & translating</p>
                </div>
              </div>
            )}

            {/* ERROR */}
            {appState === 'ERROR' && (
              <div className="bg-white rounded-3xl shadow-xl border border-red-100 p-8 space-y-6 text-center">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircleIcon className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Couldn't read that</h3>
                <p className="text-slate-600 leading-relaxed">{errorMsg}</p>
                <button onClick={reset} className="w-full py-4 bg-slate-900 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all shadow-md">
                  Try Another Photo
                </button>
              </div>
            )}

            {/* SUCCESS */}
            {appState === 'SUCCESS' && response && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Voice Script Hero */}
                <div className="bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">Voice Output</span>
                      <button
                        onClick={() => speak(response.voice_script_native)}
                        className={`p-4 rounded-full transition-all active:scale-90 shadow-lg ${isSpeaking ? 'bg-orange-500 animate-pulse' : 'bg-white text-teal-600 hover:bg-teal-50'}`}
                      >
                        <PlayIcon className="w-8 h-8" />
                      </button>
                    </div>
                    <p className="text-xl font-medium leading-relaxed italic">
                      "{response.voice_script_native}"
                    </p>
                    <hr className="border-white/20" />
                    <p className="text-teal-100 text-sm italic">
                      {response.voice_script_english}
                    </p>
                  </div>
                  {/* Decorative Background Elements */}
                  <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                </div>

                {/* Medicines List */}
                <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-teal-600" />
                      Detected Medicines
                    </h3>
                    <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">
                      {response.structured_data.medicines.length} items
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {response.structured_data.medicines.map((med, idx) => (
                      <div key={idx} className="p-6 hover:bg-slate-50 transition-colors group">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <h4 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors uppercase">{med.name}</h4>
                            <div className="flex flex-wrap gap-2 text-sm">
                              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-semibold">{med.dosage}</span>
                              <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-lg font-bold">{med.timing}</span>
                            </div>
                            {med.notes && (
                              <p className="text-sm text-slate-500 mt-2 bg-yellow-50/50 border-l-2 border-yellow-400 pl-3 py-1 italic">
                                {med.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => speak(`${med.name}. ${med.dosage}. ${med.timing}`)}
                              className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
                              title="Speak"
                            >
                              <PlayIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Patient Notes / Interactions */}
                {response.structured_data.patientNotes && (
                  <div className="bg-orange-50 rounded-3xl p-6 border border-orange-100 flex gap-4">
                    <div className="text-orange-500 flex-shrink-0 pt-1">
                      <XCircleIcon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-orange-900"> pharmacist's Note</h4>
                      <p className="text-orange-800 text-sm leading-relaxed">{response.structured_data.patientNotes}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={reset} className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95">
                    ← New Scan
                  </button>
                  <button onClick={() => window.print()} className="px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all active:scale-95">
                    <ShareIcon className="w-6 h-6" />
                  </button>
                </div>

                <p className="text-center text-xs text-slate-400 max-w-xs mx-auto">
                  AI analysis may vary. Always double-check with your physical prescription strip for accuracy.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-2">
          <p className="text-sm font-bold text-slate-400">
            AarogyaVani · Made for Bharat
          </p>
          <p className="text-xs text-slate-300">
            Scanning prescription · Deciphering handwriting · Verbalizing health
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;