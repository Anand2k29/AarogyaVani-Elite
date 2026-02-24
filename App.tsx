import React, { useState, useRef, useEffect } from 'react';
import { detectPills, DetectionResult } from './services/inferenceService';
import { PillIcon, CameraIcon, LoadingSpinner, CheckCircleIcon, XCircleIcon, ShareIcon, WarningIcon, MoonIcon, SunIcon } from './components/Icons';
import { ElderlyCompanion } from './components/ElderlyCompanion';

type AppState = 'IDLE' | 'DETECTING' | 'SUCCESS' | 'ERROR' | 'NO_MODEL';
type MainTab = 'identifier' | 'companion';

const App: React.FC = () => {
  const [mainTab, setMainTab] = useState<MainTab>('identifier');
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme === 'dark';
      return true; // Default to dark mode
    }
    return true;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const getMedAdvice = (className: string) => {
    const adviceMap: Record<string, { usedFor: string, dosage: string, warning: string }> = {
      'Pill 1': {
        usedFor: 'Pain and fever relief',
        dosage: '1 tablet every 6 hours after food',
        warning: 'Do not exceed 4 tablets in 24 hours.'
      },
      'Pill 2': {
        usedFor: 'Common cold and allergies',
        dosage: '1 tablet before sleeping',
        warning: 'May cause drowsiness. Do not drive after taking.'
      },
      'Paracetamol': {
        usedFor: 'Fever and mild pain',
        dosage: '500mg-650mg every 4-6 hours',
        warning: 'Excessive use can damage the liver.'
      }
    };
    return adviceMap[className] || {
      usedFor: 'General medication',
      dosage: 'Consult a pharmacist for exact dosage',
      warning: 'Verify name and expiry before use.'
    };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setAppState('DETECTING');
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const data = await detectPills(base64);
        setResult(data);
        setAppState('SUCCESS');
      } catch (err: any) {
        const msg: string = err?.message || 'Detection failed.';
        if (msg === 'MODEL_NOT_FOUND') {
          setAppState('NO_MODEL');
        } else {
          setAppState('ERROR');
        }
        setErrorMsg(msg);
      }
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setAppState('IDLE');
    setResult(null);
    setPreviewUrl(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`min-h-screen transition-all duration-700 flex flex-col font-sans ${isDarkMode ? 'bg-slate-950 text-white selection:bg-teal-500/30' : 'bg-slate-50 text-slate-900 selection:bg-teal-100'}`}>

      {/* Header with Glossmorphism */}
      <header className={`sticky top-0 z-30 transition-all duration-500 border-b ${isDarkMode ? 'bg-slate-900/60 border-white/10 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]' : 'bg-white/80 border-slate-200 backdrop-blur-md shadow-sm'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer group flex-shrink-0" onClick={() => { setMainTab('identifier'); reset(); }}>
            <div className="w-10 h-10 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(20,184,166,0.3)] group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] transition-all duration-300">
              <PillIcon className="w-6 h-6 animate-float" />
            </div>
            <h1 className="text-2xl font-bold tracking-tighter">
              Aarogya<span className="text-teal-500">Vani</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex p-1.5 gap-1.5 rounded-2xl ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-slate-100'}`}>
              <button
                onClick={() => { setMainTab('identifier'); reset(); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-[0.1em] transition-all duration-300 ${mainTab === 'identifier'
                  ? (isDarkMode ? 'bg-teal-600 text-white shadow-[0_0_20px_rgba(20,184,166,0.4)]' : 'bg-white text-teal-700 shadow-md')
                  : 'text-slate-500 hover:text-teal-500/80'
                  }`}
              >
                Identifier
              </button>
              <button
                onClick={() => setMainTab('companion')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-[0.1em] transition-all duration-300 ${mainTab === 'companion'
                  ? (isDarkMode ? 'bg-teal-600 text-white shadow-[0_0_20px_rgba(20,184,166,0.4)]' : 'bg-white text-teal-700 shadow-md')
                  : 'text-slate-500 hover:text-teal-500/80'
                  }`}
              >
                Companion
              </button>
            </div>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-2xl transition-all duration-300 transform active:scale-90 ${isDarkMode ? 'bg-white/5 border border-white/10 text-amber-400 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(251,191,36,0.2)]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-start p-4 sm:p-8 w-full max-w-4xl mx-auto z-10 relative">

        {/* ── Care Companion Tab ── */}
        {mainTab === 'companion' && <ElderlyCompanion />}

        {/* ── Medicine Identifier Tab ── */}
        {mainTab === 'identifier' && (
          <div className="w-full space-y-12 animate-in fade-in slide-in-from-top-4 duration-700">

            {/* INITIAL STATE - Retro-Futurist & Compact */}
            {appState === 'IDLE' && (
              <div className="flex flex-col items-center space-y-12 py-8">
                <div className="text-center space-y-6 max-w-2xl px-4">
                  <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full border text-[11px] font-bold uppercase tracking-[0.1em] mb-4 ${isDarkMode ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' : 'bg-teal-500/10 border-teal-500/20 text-teal-600'}`}>
                    <span className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-teal-400' : 'bg-teal-500'}`}></span>
                    Medicine Identification
                  </div>
                  <h2 className={`text-5xl sm:text-7xl font-bold leading-[1.1] tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Identify Your <br />
                    {isDarkMode ? <span className="text-teal-400">Medication</span> : <span className="text-teal-600">Medication</span>}
                  </h2>
                  <p className={`text-lg sm:text-xl font-medium max-w-lg mx-auto transition-colors ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    Instant, local, and secure pill identification using on-device AI.
                  </p>
                </div>

                {/* START ANALYSIS BUTTON - Refined Ergonomics */}
                <div className="w-full max-w-sm px-6">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`group relative flex items-center justify-between w-full p-6 rounded-[2rem] transition-all duration-500 active:scale-95 shadow-2xl overflow-hidden border-2 
                      ${isDarkMode
                        ? 'bg-slate-900 border-teal-500/30 text-white'
                        : 'bg-teal-600 border-teal-700 text-white hover:bg-teal-700'}`}
                  >
                    <div className="flex items-center gap-6 relative z-10">
                      <div className={`p-4 rounded-2xl shadow-lg transition-all duration-500 group-hover:rotate-6
                        ${isDarkMode ? 'bg-teal-500 text-white' : 'bg-white text-teal-600'}`}>
                        <CameraIcon className="w-10 h-10" />
                      </div>
                      <div className="text-left">
                        <span className="block text-2xl font-bold tracking-tighter leading-none">Analyze</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-teal-400' : 'text-teal-100'}`}>Tap to Start Scan</span>
                      </div>
                    </div>

                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 group-hover:translate-x-1 shadow-lg
                      ${isDarkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-white/10 text-white'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </div>

                    <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                    <div className="animate-shine opacity-30"></div>
                  </button>

                  <div className="mt-10 flex flex-wrap justify-center gap-4 opacity-60">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl border ${isDarkMode ? 'border-teal-500/20 text-teal-400' : 'border-teal-500/20 text-teal-600'}`}>Local Inference</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl border ${isDarkMode ? 'border-teal-500/20 text-teal-400' : 'border-teal-500/20 text-teal-600'}`}>Privacy Secure</span>
                  </div>
                </div>
              </div>
            )}

            {/* PROCESSING STATE */}
            {appState === 'DETECTING' && (
              <div className="flex flex-col items-center space-y-16 py-20 text-center">
                <div className="relative">
                  {previewUrl && (
                    <div className={`relative w-80 h-80 sm:w-[450px] sm:h-[450px] overflow-hidden rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border-8 transition-all duration-700 ${isDarkMode ? 'border-white/5' : 'border-white'}`}>
                      <img src={previewUrl} alt="Medication scan" className="w-full h-full object-cover transition-transform duration-[2000ms] scale-110" />
                      <div className="absolute inset-0 bg-teal-500/10 mix-blend-overlay"></div>
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-teal-500 shadow-[0_0_30px_rgba(20,184,166,1)] animate-scan z-10"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent"></div>
                    </div>
                  )}
                  <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 p-7 rounded-[2rem] shadow-2xl ring-12 transition-all duration-500 ${isDarkMode ? 'bg-slate-900 ring-slate-950/50 text-teal-400 border border-white/10 backdrop-blur-xl' : 'bg-white ring-slate-100 text-teal-600'}`}>
                    <LoadingSpinner className="w-14 h-14" />
                  </div>
                </div>
                <div className="space-y-4 max-w-md mx-auto">
                  <h3 className="text-5xl font-bold tracking-tighter animate-pulse text-teal-500">Processing...</h3>
                  <p className="text-lg font-bold text-slate-400 uppercase tracking-widest leading-loose">Local AI Analysis in Progress</p>
                </div>
              </div>
            )}

            {/* SUCCESS STATE */}
            {appState === 'SUCCESS' && result && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pb-32 animate-in slide-in-from-bottom-12 duration-1000">

                {/* Image Section */}
                <div className="lg:col-span-5 space-y-10 lg:sticky lg:top-28">
                  <div className={`relative rounded-[3.5rem] overflow-hidden shadow-2xl border transition-all duration-700 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'}`}>
                    {previewUrl && <img src={previewUrl} alt="Detection result" className="w-full object-contain max-h-[35rem] hover:scale-105 transition-transform duration-1000" />}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/40 to-transparent p-10 pt-24">
                      <div className="flex items-end justify-between">
                        <div className="space-y-2">
                          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-teal-400">Processing Node: LOCAL-01</p>
                          <p className="text-7xl font-bold leading-none text-white tracking-tighter">SUCCESS</p>
                        </div>
                        <div className="text-right text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] leading-relaxed">
                          <p>Lat: {result.inferenceTimeMs}ms</p>
                          <p>On-Device AI</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <button onClick={reset} className="w-full py-6 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-[2rem] transition-all duration-500 shadow-[0_20px_40px_-10px_rgba(20,184,166,0.3)] hover:shadow-[0_30px_60px_-15px_rgba(20,184,166,0.5)] active:scale-95 flex items-center justify-center gap-4 text-xl tracking-tighter">
                      <CameraIcon className="w-7 h-7" />
                      New Analysis
                    </button>
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => window.print()} className="gloss-card py-5 border font-bold rounded-2xl transition-all duration-500 flex items-center justify-center gap-2 text-xs uppercase tracking-widest glass">
                        <ShareIcon className="w-5 h-5" />
                        Export PDF
                      </button>
                      <button onClick={reset} className="gloss-card py-5 border font-bold rounded-2xl transition-all duration-500 flex items-center justify-center gap-2 text-xs uppercase tracking-widest glass">
                        <XCircleIcon className="w-5 h-5" />
                        Clear Cache
                      </button>
                    </div>
                  </div>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-7 space-y-10">
                  <div className={`rounded-[3.5rem] shadow-2xl border transition-all duration-700 overflow-hidden ${isDarkMode ? 'bg-white/5 border-white/10 backdrop-blur-3xl' : 'bg-white border-slate-100'}`}>
                    <div className={`px-12 py-10 border-b transition-colors ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-slate-50 bg-slate-50/50'}`}>
                      <h3 className="text-3xl font-bold tracking-tighter flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.5)]">
                          <CheckCircleIcon className="w-7 h-7" />
                        </div>
                        AI Analysis Report
                      </h3>
                    </div>

                    <div className="p-12 space-y-12">
                      {result.detections.length > 0 ? (
                        (() => {
                          const topResult = [...result.detections].sort((a, b) => b.confidence - a.confidence)[0];
                          const advice = getMedAdvice(topResult.className);
                          const displayConf = Math.min(100, Math.round(topResult.confidence * 100));

                          return (
                            <div className="space-y-12 animate-in fade-in duration-1000">
                              {/* Top Result Card - Retro-Futurist */}
                              <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-white/5">
                                  <div className="space-y-2">
                                    <p className={`text-[12px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>Medication Result</p>
                                    <h4 className={`text-4xl sm:text-6xl font-bold tracking-tighter uppercase leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                      {topResult.className}
                                    </h4>
                                  </div>
                                  <div className={`flex items-center gap-4 p-4 rounded-2xl border shadow-inner ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="text-right">
                                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Confidence</p>
                                      <p className={`text-2xl font-bold ${displayConf >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>{displayConf}%</p>
                                    </div>
                                    <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-lg transition-all ${displayConf >= 90 ? 'border-emerald-500/20 text-emerald-400' : 'border-amber-500/20 text-amber-400'}`}>
                                      {displayConf > 95 ? 'S' : displayConf > 85 ? 'A' : 'B'}
                                    </div>
                                  </div>
                                </div>

                                {/* Glossy Detail Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                                  <div className="gloss-card group p-8 space-y-3 border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-500 relative">
                                    <p className={`text-[11px] font-bold uppercase tracking-[0.1em] ${isDarkMode ? 'text-teal-400/60' : 'text-slate-500'}`}>Used For</p>
                                    <p className="text-xl font-bold leading-tight text-white transition-colors uppercase">{advice.usedFor}</p>
                                  </div>
                                  <div className={`gloss-card group p-8 space-y-3 border transition-all duration-500 relative ${isDarkMode ? 'border-teal-500/20 bg-teal-500/5 hover:bg-teal-500/10' : 'border-teal-500/20 bg-teal-500/5 hover:bg-teal-500/10'}`}>
                                    <p className={`text-[11px] font-bold uppercase tracking-[0.1em] ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>Typical Dosage</p>
                                    <p className={`text-xl font-bold leading-tight transition-colors uppercase ${isDarkMode ? 'text-teal-400' : 'text-teal-700'}`}>{advice.dosage}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Clinical Caution Alert */}
                              <div className={`group p-8 rounded-[2.5rem] border flex flex-col sm:flex-row gap-6 items-center sm:items-start relative overflow-hidden transition-all duration-500 ${isDarkMode ? 'bg-red-500/5 border-red-500/30' : 'bg-red-50 border-red-100'}`}>
                                <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg">
                                  <WarningIcon className="w-6 h-6" />
                                </div>
                                <div className="space-y-2 text-center sm:text-left relative z-10">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">Critical Patient Alert</p>
                                  <p className={`text-lg font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-red-900'}`}>
                                    {advice.warning}
                                  </p>
                                </div>
                              </div>

                              {/* AI Recommendations */}
                              <div className="pt-12 border-t border-white/5 space-y-8">
                                <div className="flex items-center gap-4">
                                  <div className={`w-3 h-3 rounded-full animate-ping ${isDarkMode ? 'bg-teal-600' : 'bg-teal-500'}`}></div>
                                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em]">Health AI Verification</p>
                                </div>
                                <div className="p-10 rounded-[3rem] border border-white/5 bg-white/5 space-y-6 transition-all duration-700">
                                  <p className="text-lg text-slate-300 font-medium leading-[1.6] tracking-tight">
                                    Our local model identifies this as <span className={` italic font-bold ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>{topResult.className}</span>.
                                    Always verify with physical packaging and pharmacist advisory.
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="py-24 text-center space-y-8">
                          <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-700">
                            <XCircleIcon className="w-12 h-12" />
                          </div>
                          <div className="space-y-4">
                            <h4 className="text-4xl font-bold text-slate-300 tracking-tighter uppercase italic">No Match Found</h4>
                            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Confidence threshold not met</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Legal Disclaimer */}
                  <div className={`rounded-[3rem] p-8 border transition-all duration-500 group ${isDarkMode ? 'border-teal-500/20 bg-teal-500/5 text-teal-400/60' : 'border-amber-500/20 bg-amber-500/5 text-amber-600'}`}>
                    <div className="flex items-center gap-6">
                      <WarningIcon className="w-8 h-8 flex-shrink-0" />
                      <p className="text-[10px] font-bold leading-relaxed uppercase tracking-[0.1em]">
                        Not a substitute for professional medical diagnosis.
                        Local AI identification may vary by environment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ERROR & EMPTY STATES */}
            {(appState === 'NO_MODEL' || appState === 'ERROR') && (
              <div className="max-w-xl mx-auto py-16 px-4">
                <div className={`rounded-[3.5rem] p-12 space-y-10 text-center border-t-[12px] shadow-2xl ${isDarkMode ? 'bg-black border-red-600' : 'bg-white border-red-500'}`}>
                  <div className="w-20 h-20 rounded-[2rem] bg-red-600/10 text-red-600 flex items-center justify-center mx-auto border border-red-500/20">
                    <WarningIcon className="w-10 h-10" />
                  </div>
                  <div className="space-y-4">
                    <h3 className={`text-4xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {appState === 'NO_MODEL' ? 'AI Engine Missing' : 'Scanner Error'}
                    </h3>
                    <p className={`text-lg font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {appState === 'NO_MODEL' ? "Local AI model not found in the application structure." : errorMsg}
                    </p>
                  </div>
                  <button onClick={reset} className="w-full py-5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl transition-all text-lg shadow-xl active:scale-95 uppercase tracking-tighter">
                    Re-initialize Scanner
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className={`py-16 mt-20 border-t ${isDarkMode ? 'bg-black border-white/5' : 'bg-slate-50 border-slate-200'}`}>
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg animate-float">
              <PillIcon className="w-6 h-6" />
            </div>
            <p className={`text-2xl font-bold tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Aarogya<span className="text-teal-500">Vani</span>
            </p>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500">
            India's Premium Edge-AI Health Companion
          </p>
          <div className="flex justify-center gap-8 opacity-40 text-[9px] font-bold uppercase tracking-[0.3em]">
            <span>Local v2.4</span>
            <span>WASM-Core</span>
            <span>Bhartiya AI</span>
          </div>
        </div>
      </footer>

      {/* Glossy Background Blobs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className={`absolute -top-48 -left-48 w-[40rem] h-[40rem] rounded-full blur-[150px] transition-all duration-[2000ms] ${isDarkMode ? 'bg-teal-600/10' : 'bg-teal-600/15'}`}></div>
        <div className={`absolute top-1/2 -right-48 w-[50rem] h-[50rem] rounded-full blur-[200px] transition-all duration-[2000ms] ${isDarkMode ? 'bg-indigo-600/5' : 'bg-indigo-600/10'}`}></div>
        <div className={`absolute -bottom-48 left-1/4 w-[30rem] h-[30rem] rounded-full blur-[180px] transition-all duration-[2000ms] ${isDarkMode ? 'bg-emerald-600/5' : 'bg-emerald-600/10'}`}></div>
      </div>
    </div>
  );
};

export default App;
