import React, { useState, useRef, useEffect } from 'react';
import { decodePrescription, DecodeResult } from './services/inferenceService';
import { speakInstructions, stopSpeaking } from './services/audioService';
import { PillIcon, CameraIcon, LoadingSpinner, CheckCircleIcon, XCircleIcon, ShareIcon, WarningIcon, MoonIcon, SunIcon } from './components/Icons';
import { ElderlyCompanion } from './components/ElderlyCompanion';

type AppState = 'IDLE' | 'DETECTING' | 'SUCCESS' | 'ERROR' | 'MISSING_KEY';
type MainTab = 'scanner' | 'companion';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'kn', name: 'Kannada' },
  { code: 'te', name: 'Telugu' },
  { code: 'ta', name: 'Tamil' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mr', name: 'Marathi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'gu', name: 'Gujarati' },
];

const App: React.FC = () => {
  const [mainTab, setMainTab] = useState<MainTab>('scanner');
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>('Kannada'); // Default to Kannada based on user prompt example
  const [apiKey, setApiKey] = useState<string>(import.meta.env.VITE_GEMINI_API_KEY || '');
  const [showSettings, setShowSettings] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

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
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!apiKey) {
      setAppState('MISSING_KEY');
      setShowSettings(true);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setAppState('DETECTING');
    setErrorMsg(null);
    stopSpeaking();
    setIsPlaying(false);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const data = await decodePrescription(base64, language, apiKey);
        setResult(data);
        setAppState('SUCCESS');
      } catch (err: any) {
        const msg: string = err?.message || 'Detection failed.';
        if (msg === 'API_KEY_MISSING') {
          setAppState('MISSING_KEY');
          setShowSettings(true);
        } else {
          setAppState('ERROR');
        }
        setErrorMsg(msg);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleAudio = () => {
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
    } else if (result) {
      // Build a smooth spoken string
      let textToSpeak = result.rawSummary + ". ";
      result.items.forEach((item, index) => {
        textToSpeak += `Medicine ${index + 1}: ${item.medicineName}. Used for: ${item.usedFor}. ${item.translatedDosage}. `;
        if (item.warning) textToSpeak += `Warning: ${item.warning}. `;
      });
      speakInstructions(textToSpeak, language);
      setIsPlaying(true);

      // Auto-reset play button after a rough estimate (or rely on user to stop)
      setTimeout(() => setIsPlaying(false), 15000); // Simple fallback timeout
    }
  };

  const reset = () => {
    setAppState('IDLE');
    setResult(null);
    setPreviewUrl(null);
    setErrorMsg(null);
    stopSpeaking();
    setIsPlaying(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`min-h-screen transition-all duration-700 flex flex-col font-sans ${isDarkMode ? 'bg-slate-950 text-white selection:bg-teal-500/30' : 'bg-slate-50 text-slate-900 selection:bg-teal-100'}`}>

      {/* Header with Glossmorphism */}
      <header className={`sticky top-0 z-30 transition-all duration-500 border-b ${isDarkMode ? 'bg-slate-900/60 border-white/10 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]' : 'bg-white/80 border-slate-200 backdrop-blur-md shadow-sm'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer group flex-shrink-0" onClick={() => { setMainTab('scanner'); reset(); }}>
            <div className="w-10 h-10 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(20,184,166,0.3)] group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 animate-float" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tighter">
              Aarogya<span className="text-teal-500">Vani</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex p-1.5 gap-1.5 rounded-2xl ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-slate-100'}`}>
              <button
                onClick={() => { setMainTab('scanner'); reset(); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-[0.1em] transition-all duration-300 ${mainTab === 'scanner'
                  ? (isDarkMode ? 'bg-teal-600 text-white shadow-[0_0_20px_rgba(20,184,166,0.4)]' : 'bg-white text-teal-700 shadow-md')
                  : 'text-slate-500 hover:text-teal-500/80'
                  }`}
              >
                Scanner
              </button>
              <button
                onClick={() => setMainTab('companion')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-[0.1em] transition-all duration-300 ${mainTab === 'companion'
                  ? (isDarkMode ? 'bg-teal-600 text-white shadow-[0_0_20px_rgba(20,184,166,0.4)]' : 'bg-white text-teal-700 shadow-md')
                  : 'text-slate-500 hover:text-teal-500/80'
                  }`}
              >
                Features
              </button>
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2.5 rounded-2xl transition-all duration-300 transform active:scale-90 ${showSettings ? 'bg-teal-500/20 text-teal-400' : isDarkMode ? 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              aria-label="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

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

      {/* Settings Panel */}
      {showSettings && (
        <div className={`absolute top-20 right-4 sm:right-6 w-80 p-6 rounded-3xl shadow-2xl z-40 border animate-in fade-in slide-in-from-top-4 ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
          <div className="space-y-4">
            <div>
              <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>Gemini API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => saveApiKey(e.target.value)}
                placeholder="Paste API Key here..."
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${isDarkMode ? 'bg-black/50 border-white/10 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              />
            </div>
            <p className={`text-[10px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Keys are stored offline in your browser's local storage and are never uploaded. Required for OCR and translation.
            </p>
          </div>
        </div>
      )}

      <main className="flex-grow flex flex-col items-center justify-start p-4 sm:p-8 w-full max-w-4xl mx-auto z-10 relative">

        {/* ── Care Companion Tab ── */}
        {mainTab === 'companion' && <ElderlyCompanion />}

        {/* ── Medicine Identifier Tab ── */}
        {mainTab === 'scanner' && (
          <div className="w-full space-y-12 animate-in fade-in slide-in-from-top-4 duration-700">

            {/* INITIAL STATE - Retro-Futurist & Compact */}
            {appState === 'IDLE' && (
              <div className="flex flex-col items-center space-y-10 py-8">
                <div className="text-center space-y-6 max-w-2xl px-4">
                  <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full border text-[11px] font-bold uppercase tracking-[0.1em] mb-2 ${isDarkMode ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' : 'bg-teal-500/10 border-teal-500/20 text-teal-600'}`}>
                    <span className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-teal-400' : 'bg-teal-500'}`}></span>
                    AI Voice Companion
                  </div>
                  <h2 className={`text-4xl sm:text-6xl font-bold leading-[1.1] tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Decode prescriptions<br />
                    in <span className="text-teal-500">your language</span>
                  </h2>
                  <p className={`text-lg sm:text-xl font-medium max-w-lg mx-auto transition-colors ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    Scan handwritten doctor notes and listen to the instructions verbally.
                  </p>
                </div>

                {/* Language Selection */}
                <div className="w-full max-w-sm px-6">
                  <label className={`block text-[10px] font-bold uppercase tracking-widest pl-2 mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Translate Output To</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className={`w-full p-4 rounded-2xl appearance-none font-bold text-lg border-2 transition-all cursor-pointer ${isDarkMode ? 'bg-slate-900 border-white/10 text-white focus:border-teal-500/50' : 'bg-white border-slate-200 text-slate-800 focus:border-teal-500'}`}
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.name}>{lang.name}</option>
                    ))}
                  </select>
                </div>

                {/* START ANALYSIS BUTTON - Refined Ergonomics */}
                <div className="w-full max-w-sm px-6">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`group relative flex items-center justify-between w-full p-6 rounded-[2rem] transition-all duration-500 active:scale-95 shadow-2xl overflow-hidden border-2 
                      ${isDarkMode
                        ? 'bg-slate-900 border-teal-500/30 text-white hover:border-teal-500/60'
                        : 'bg-teal-600 border-teal-700 text-white hover:bg-teal-700'}`}
                  >
                    <div className="flex items-center gap-6 relative z-10">
                      <div className={`p-4 rounded-2xl shadow-lg transition-all duration-500 group-hover:rotate-6
                        ${isDarkMode ? 'bg-teal-500 text-white' : 'bg-white text-teal-600'}`}>
                        <CameraIcon className="w-10 h-10" />
                      </div>
                      <div className="text-left">
                        <span className="block text-2xl font-bold tracking-tighter leading-none">Scan</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-teal-400' : 'text-teal-100'}`}>Upload Prescription</span>
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
                      <div className="absolute inset-0 bg-teal-500/20 mix-blend-overlay"></div>
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-teal-500 shadow-[0_0_30px_rgba(20,184,166,1)] animate-scan z-10"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent"></div>
                    </div>
                  )}
                  <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 p-7 rounded-[2rem] shadow-2xl ring-12 transition-all duration-500 ${isDarkMode ? 'bg-slate-900 ring-slate-950/50 text-teal-400 border border-white/10 backdrop-blur-xl' : 'bg-white ring-slate-100 text-teal-600'}`}>
                    <LoadingSpinner className="w-14 h-14" />
                  </div>
                </div>
                <div className="space-y-4 max-w-md mx-auto">
                  <h3 className="text-5xl font-bold tracking-tighter animate-pulse text-teal-500">Decoding...</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-loose">Extracting Handwriting & Translating to {language}</p>
                </div>
              </div>
            )}

            {/* SUCCESS STATE */}
            {appState === 'SUCCESS' && result && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pb-32 animate-in slide-in-from-bottom-12 duration-1000">

                {/* Image Section */}
                <div className="lg:col-span-5 space-y-10 lg:sticky lg:top-28">
                  <div className={`relative rounded-[3.5rem] overflow-hidden shadow-2xl border transition-all duration-700 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'}`}>
                    {previewUrl && <img src={previewUrl} alt="Detection result" className="w-full object-contain max-h-[35rem]" />}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/40 to-transparent p-10 pt-24">
                      <div className="flex items-end justify-between">
                        <div className="space-y-2">
                          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-teal-400">Translation Complete</p>
                          <p className="text-5xl font-bold leading-none text-white tracking-tighter">{language}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <button onClick={toggleAudio} className={`w-full py-6 font-bold rounded-[2rem] transition-all duration-500 shadow-[0_20px_40px_-10px_rgba(20,184,166,0.3)] hover:shadow-[0_30px_60px_-15px_rgba(20,184,166,0.5)] active:scale-95 flex items-center justify-center gap-4 text-xl tracking-tighter ${isPlaying ? 'bg-red-500 text-white' : 'bg-teal-600 text-white hover:bg-teal-500'}`}>
                      {isPlaying ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                          </svg>
                          Stop Audio
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                          Speak Instructions
                        </>
                      )}
                    </button>
                    <button onClick={reset} className={`w-full py-5 border font-bold rounded-2xl transition-all duration-500 flex items-center justify-center gap-2 text-sm uppercase tracking-widest ${isDarkMode ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      <CameraIcon className="w-5 h-5" />
                      Scan New Prescription
                    </button>
                  </div>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-7 space-y-10">
                  <div className={`rounded-[3.5rem] shadow-2xl border transition-all duration-700 overflow-hidden ${isDarkMode ? 'bg-white/5 border-white/10 backdrop-blur-3xl' : 'bg-white border-slate-100'}`}>

                    {/* Summary Header */}
                    <div className={`px-10 py-10 border-b space-y-4 transition-colors ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-slate-50 bg-slate-50/50'}`}>
                      <h3 className="text-3xl font-bold tracking-tighter flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.5)]">
                          <CheckCircleIcon className="w-7 h-7" />
                        </div>
                        Prescription Decoded
                      </h3>
                      {result.rawSummary && (
                        <p className={`text-xl font-medium leading-relaxed italic border-l-4 border-teal-500 pl-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          "{result.rawSummary}"
                        </p>
                      )}
                    </div>

                    <div className="p-8 sm:p-12 space-y-12">
                      {result.items.length > 0 ? (
                        <div className="space-y-10">
                          {result.items.map((item, idx) => (
                            <div key={idx} className={`p-8 rounded-[2.5rem] border space-y-6 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                              <div className="space-y-1">
                                <p className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>Medicine {idx + 1}</p>
                                <h4 className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.medicineName}</h4>
                                <p className={`text-sm italic ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.usedFor}</p>
                              </div>

                              <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-teal-500/10 border-teal-500/20' : 'bg-teal-50 border-teal-100'}`}>
                                <p className={`text-[10px] font-bold uppercase tracking-[0.1em] mb-2 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>Instructions ({language})</p>
                                <p className={`text-2xl font-bold leading-tight ${isDarkMode ? 'text-teal-50' : 'text-teal-900'}`}>{item.translatedDosage}</p>
                              </div>

                              {item.warning && (
                                <div className={`p-4 rounded-xl flex items-start gap-4 ${isDarkMode ? 'bg-red-500/10 text-red-200' : 'bg-red-50 text-red-800'}`}>
                                  <WarningIcon className="w-6 h-6 flex-shrink-0 text-red-500" />
                                  <p className="text-sm font-medium">{item.warning}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-24 text-center space-y-8">
                          <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-700">
                            <XCircleIcon className="w-12 h-12" />
                          </div>
                          <div className="space-y-4">
                            <h4 className="text-4xl font-bold text-slate-300 tracking-tighter uppercase italic">No Medicines Found</h4>
                            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Could not read prescription text</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ERROR & EMPTY STATES */}
            {(appState === 'MISSING_KEY' || appState === 'ERROR') && (
              <div className="max-w-xl mx-auto py-16 px-4">
                <div className={`rounded-[3.5rem] p-12 space-y-10 text-center border-t-[12px] shadow-2xl ${isDarkMode ? 'bg-black border-red-600' : 'bg-white border-red-500'}`}>
                  <div className="w-20 h-20 rounded-[2rem] bg-red-600/10 text-red-600 flex items-center justify-center mx-auto border border-red-500/20">
                    <WarningIcon className="w-10 h-10" />
                  </div>
                  <div className="space-y-4">
                    <h3 className={`text-4xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {appState === 'MISSING_KEY' ? 'API Key Required' : 'Decipher Error'}
                    </h3>
                    <p className={`text-lg font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {appState === 'MISSING_KEY' ? "Please click the Settings gear icon in the top right and enter a Gemini API Key to decode handwriting." : errorMsg}
                    </p>
                  </div>
                  <button onClick={reset} className="w-full py-5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl transition-all text-lg shadow-xl active:scale-95 uppercase tracking-tighter">
                    Return to Scanner
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
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <p className={`text-2xl font-bold tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Aarogya<span className="text-teal-500">Vani</span>
            </p>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500">
            AI Voice Companion for Healthcare
          </p>
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
