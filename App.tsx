import React, { useState, useRef } from 'react';
import { detectPills, DetectionResult } from './services/inferenceService';
import { PillIcon, CameraIcon, LoadingSpinner, CheckCircleIcon, XCircleIcon, ShareIcon, WarningIcon } from './components/Icons';
import { ElderlyCompanion } from './components/ElderlyCompanion';

type AppState = 'IDLE' | 'DETECTING' | 'SUCCESS' | 'ERROR' | 'NO_MODEL';
type MainTab = 'identifier' | 'companion';

const App: React.FC = () => {
  const [mainTab, setMainTab] = useState<MainTab>('identifier');
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock Advice Database - This will be replaced by the India Medicine dataset later
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => { setMainTab('identifier'); reset(); }}>
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white">
              <PillIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Aarogya<span className="text-teal-600">Vani</span>
            </h1>
          </div>

          {/* Top-level tab switcher */}
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => { setMainTab('identifier'); reset(); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${mainTab === 'identifier'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              💊 Identifier
            </button>
            <button
              onClick={() => setMainTab('companion')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${mainTab === 'companion'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              👵 Companion
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow flex flex-col items-center justify-start p-4 sm:p-8 w-full max-w-4xl mx-auto">

        {/* ── Care Companion Tab ── */}
        {mainTab === 'companion' && <ElderlyCompanion />}

        {/* ── Medicine Identifier Tab ── */}
        {mainTab === 'identifier' && (
          <div className="w-full space-y-8 animate-in fade-in duration-500">

            {/* 1. INITIAL STATE (IDLE) */}
            {appState === 'IDLE' && (
              <div className="flex flex-col items-center space-y-10 py-10">
                <div className="text-center space-y-4">
                  <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight">
                    Identify Medicine <br />
                    <span className="text-teal-600">Scan &amp; Learn.</span>
                  </h2>
                  <p className="text-xl text-slate-500 max-w-lg mx-auto leading-relaxed">
                    Identify pills or medicine strips instantly. All AI analysis happens 100% on your device for total privacy.
                  </p>
                </div>

                <div className="w-full max-w-md bg-white p-8 rounded-[2rem] shadow-2xl border border-slate-200">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative flex flex-col items-center justify-center gap-4 w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-10 px-8 rounded-3xl transition-all shadow-xl hover:shadow-2xl active:scale-[0.98] overflow-hidden"
                  >
                    <div className="bg-white/20 p-5 rounded-full ring-4 ring-white/10 group-hover:scale-110 transition-transform">
                      <CameraIcon className="w-12 h-12" />
                    </div>
                    <span className="text-2xl tracking-tight">Identify Medication</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {/* Background glow effect */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                  </button>
                  <div className="mt-6 flex flex-col items-center gap-3 text-center">
                    <p className="text-sm font-medium text-slate-400 italic">
                      Supports offline scans · Zero internet required
                    </p>
                    <div className="flex gap-4">
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">100% Private</span>
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">On-Device AI</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. PROCESSING STATE (DETECTING) */}
            {appState === 'DETECTING' && (
              <div className="flex flex-col items-center space-y-10 py-12 text-center">
                <div className="relative group">
                  {previewUrl && (
                    <div className="relative w-64 h-64 sm:w-80 sm:h-80 overflow-hidden rounded-[2.5rem] shadow-2xl">
                      <img src={previewUrl} alt="Medication scan" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-teal-600/20 mix-blend-overlay animate-pulse"></div>
                    </div>
                  )}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white p-6 rounded-full shadow-2xl ring-8 ring-slate-50/50">
                    <LoadingSpinner className="w-12 h-12 text-teal-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Analyzing Medication...</h3>
                  <p className="text-slate-500 font-medium">Running local YOLOv8 inference</p>
                </div>
              </div>
            )}

            {/* 3. SUCCESS STATE (SUCCESS) */}
            {appState === 'SUCCESS' && result && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-12 animate-in slide-in-from-bottom-6 duration-500">

                {/* Left Column: Image & Detection Stats */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="relative bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200">
                    {previewUrl && <img src={previewUrl} alt="Detection result" className="w-full object-contain max-h-96" />}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/80 to-transparent p-6 pt-12">
                      <div className="flex items-end justify-between text-white">
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-teal-300 mb-1">Items Detected</p>
                          <p className="text-5xl font-black">{result.count}</p>
                        </div>
                        <div className="text-right text-[10px] font-bold opacity-70 leading-tight">
                          <p>ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                          <p>Lat: {result.inferenceTimeMs}ms</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button onClick={reset} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2">
                    <CameraIcon className="w-5 h-5" />
                    Scan Another Medicine
                  </button>
                  <button onClick={() => window.print()} className="w-full py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                    <ShareIcon className="w-5 h-5" />
                    Share Report
                  </button>
                </div>

                {/* Right Column: Detailed Advice Panel */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <CheckCircleIcon className="w-6 h-6 text-teal-600" />
                        AI Identification Result
                      </h3>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {result.detections.length > 0 ? (
                        result.detections.map((d, i) => {
                          const advice = getMedAdvice(d.className);
                          return (
                            <div key={i} className="p-8 space-y-6 hover:bg-slate-50/50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-black text-lg shadow-sm border border-teal-200">
                                    {i + 1}
                                  </div>
                                  <h4 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{d.className}</h4>
                                </div>
                                <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest ${d.confidence >= 0.75 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                  {(d.confidence * 100).toFixed(0)}% Confident
                                </span>
                              </div>

                              {/* Advice Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-slate-100/50 p-4 rounded-2xl space-y-1">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medical Use</p>
                                  <p className="font-bold text-slate-700">{advice.usedFor}</p>
                                </div>
                                <div className="bg-teal-50/50 p-4 rounded-2xl space-y-1 border border-teal-100/50">
                                  <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest">Standard Dosage</p>
                                  <p className="font-bold text-teal-900">{advice.dosage}</p>
                                </div>
                              </div>

                              <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl flex gap-4">
                                <WarningIcon className="w-6 h-6 text-orange-500 flex-shrink-0 pt-0.5" />
                                <div className="space-y-1">
                                  <p className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Critical Safety Note</p>
                                  <p className="text-sm font-bold text-orange-900 leading-snug">{advice.warning}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-12 text-center space-y-4">
                          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                            <XCircleIcon className="w-12 h-12" />
                          </div>
                          <h4 className="text-xl font-bold text-slate-800">No Medications Identified</h4>
                          <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed">
                            We couldn't clearly identify any pills or strips in this photo. Please try a clearer, well-lit image.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-8 space-y-3">
                    <h4 className="font-black text-amber-900 text-lg flex items-center gap-2">
                      <WarningIcon className="w-6 h-6" />
                      Medical Disclaimer
                    </h4>
                    <p className="text-sm font-bold text-amber-800 leading-relaxed">
                      This AI detection is for informational purposes only. On-device computer vision can misidentify visually similar medicines.
                      <strong> Never take medication based solely on this scan.</strong> Always check the physical strip or consult a professional.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. MODAL/ERROR STATES (NO_MODEL / ERROR) */}
            {(appState === 'NO_MODEL' || appState === 'ERROR') && (
              <div className="max-w-xl mx-auto py-12">
                <div className="bg-white rounded-[2.5rem] shadow-2xl border-t-8 border-orange-500 p-10 space-y-6 text-center">
                  <div className="w-24 h-24 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <WarningIcon className="w-12 h-12" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                      {appState === 'NO_MODEL' ? 'Model Training Required' : 'Scan Failed'}
                    </h3>
                    <p className="text-slate-500 mt-2 font-medium">
                      {appState === 'NO_MODEL'
                        ? "The local AI model hasn't been prepared yet. Follow the training guide in the documentation."
                        : errorMsg}
                    </p>
                  </div>

                  {appState === 'NO_MODEL' && (
                    <div className="bg-slate-900 text-green-400 rounded-2xl p-6 text-left font-mono text-sm overflow-x-auto shadow-inner">
                      <p className="opacity-50 mb-2"># Run in model/ directory</p>
                      <p>cd model</p>
                      <p>pip install -r requirements.txt</p>
                      <p>python train.py</p>
                      <p>python export_onnx.py</p>
                    </div>
                  )}

                  <button onClick={reset} className="w-full py-4 bg-slate-900 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all shadow-xl active:scale-95">
                    ← Go Back & Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 bg-teal-600 rounded flex items-center justify-center text-white">
              <PillIcon className="w-3.5 h-3.5" />
            </div>
            <p className="text-lg font-black text-slate-900 tracking-tight">
              Aarogya<span className="text-teal-600">Vani</span>
            </p>
          </div>
          <p className="text-sm font-bold text-slate-400 max-w-sm mx-auto leading-relaxed">
            Privacy-first medicine identification · 100% on-device AI · Bharat's Voice Healthcare Companion.
          </p>
          <div className="pt-4 flex items-center justify-center gap-6 grayscale opacity-40">
            <span className="text-[10px] font-black uppercase tracking-widest">WASM Inference</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Vite React</span>
            <span className="text-[10px] font-black uppercase tracking-widest">YOLOv8</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;