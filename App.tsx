import React, { useState, useRef } from 'react';
import { detectPills } from './services/inferenceService';
import { DetectionResult } from './services/inferenceService';
import { PillIcon, CameraIcon, LoadingSpinner } from './components/Icons';
import { ElderlyCompanion } from './components/ElderlyCompanion';

type AppState = 'IDLE' | 'DETECTING' | 'SUCCESS' | 'ERROR' | 'NO_MODEL';
type MainTab = 'detector' | 'companion';

const App: React.FC = () => {
  const [mainTab, setMainTab] = useState<MainTab>('detector');
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => { setMainTab('detector'); reset(); }}>
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
              onClick={() => { setMainTab('detector'); reset(); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${mainTab === 'detector'
                  ? 'bg-white text-teal-700 shadow'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              💊 Pill Detector
            </button>
            <button
              onClick={() => setMainTab('companion')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${mainTab === 'companion'
                  ? 'bg-white text-teal-700 shadow'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              👴 Care Companion
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow flex flex-col items-center justify-start p-4 sm:p-8">

        {/* ── Care Companion Tab ── */}
        {mainTab === 'companion' && <ElderlyCompanion />}

        {/* ── Pill Detector Tab ── */}
        {mainTab === 'detector' && (
          <>
            {/* IDLE */}
            {appState === 'IDLE' && (
              <div className="w-full max-w-lg space-y-8 text-center">
                <div className="space-y-3">
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                    Count &amp; Detect Pills <br />
                    <span className="text-teal-600">instantly.</span>
                  </h2>
                  <p className="text-lg text-slate-500 max-w-md mx-auto">
                    Upload a photo of your medicines. Our on-device AI will detect and count every pill — no internet required.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="group flex items-center justify-center gap-3 w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                  >
                    <CameraIcon className="w-6 h-6" />
                    <span>Take Photo / Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </button>
                  <p className="text-xs text-slate-400 mt-3">
                    Supports JPG, PNG · Runs entirely on your device
                  </p>
                </div>
              </div>
            )}

            {/* DETECTING */}
            {appState === 'DETECTING' && (
              <div className="flex flex-col items-center space-y-6 text-center">
                {previewUrl && (
                  <img src={previewUrl} alt="Uploaded" className="w-64 h-64 object-cover rounded-2xl shadow-xl" />
                )}
                <div className="relative">
                  <div className="absolute inset-0 bg-teal-200 rounded-full opacity-20 animate-ping" />
                  <div className="relative bg-white p-4 rounded-full shadow-xl">
                    <LoadingSpinner className="w-10 h-10 text-teal-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Detecting Pills…</h3>
                  <p className="text-slate-500 mt-1">Running local AI model</p>
                </div>
              </div>
            )}

            {/* SUCCESS */}
            {appState === 'SUCCESS' && result && (
              <div className="w-full max-w-2xl space-y-6">
                <div className="bg-teal-600 text-white rounded-2xl p-5 flex items-center justify-between shadow-lg">
                  <div>
                    <p className="text-teal-100 text-sm font-medium">Pills Detected</p>
                    <p className="text-5xl font-extrabold">{result.count}</p>
                  </div>
                  <div className="text-right text-teal-200 text-sm">
                    <p>Inference: {result.inferenceTimeMs}ms</p>
                    <p>Image: {result.imageWidth}×{result.imageHeight}px</p>
                  </div>
                </div>

                {previewUrl && (
                  <div className="relative bg-white rounded-2xl overflow-hidden shadow border border-slate-200">
                    <img src={previewUrl} alt="Detection input" className="w-full object-contain max-h-72" />
                  </div>
                )}

                {result.detections.length > 0 ? (
                  <div className="bg-white rounded-2xl shadow border border-slate-200 divide-y divide-slate-100">
                    {result.detections.map((d, i) => (
                      <div key={i} className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
                            {i + 1}
                          </div>
                          <span className="font-medium text-slate-800">{d.className}</span>
                        </div>
                        <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${d.confidence >= 0.75 ? 'bg-green-100 text-green-700' :
                          d.confidence >= 0.55 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                          {(d.confidence * 100).toFixed(0)}% conf
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-yellow-50 rounded-2xl p-5 text-center text-yellow-700 border border-yellow-100">
                    Model ran but found no pills above confidence threshold. Try a clearer image.
                  </div>
                )}

                <button onClick={reset} className="w-full py-3 bg-slate-900 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors">
                  ← Scan Another
                </button>
              </div>
            )}

            {/* NO_MODEL */}
            {appState === 'NO_MODEL' && (
              <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border-l-4 border-orange-400 p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-900">⚙️ Model Not Found</h3>
                <p className="text-slate-600 text-sm">
                  The pill detection model hasn't been trained and exported yet.
                  Run the following commands in the <code className="bg-slate-100 px-1 rounded">model/</code> folder:
                </p>
                <pre className="bg-slate-900 text-green-400 rounded-xl p-4 text-xs overflow-x-auto">
                  {`cd model\npip install -r requirements.txt\npython train.py\npython export_onnx.py`}
                </pre>
                <p className="text-xs text-slate-400">
                  After training completes, the ONNX model will be automatically placed in <code className="bg-slate-100 px-1 rounded">public/models/</code> and the app will use it.
                </p>
                <button onClick={reset} className="w-full py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition-colors">
                  ← Go Back
                </button>
              </div>
            )}

            {/* ERROR */}
            {appState === 'ERROR' && (
              <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border-l-4 border-red-500 p-6 space-y-4 text-center">
                <h3 className="text-lg font-bold text-slate-900">Detection Failed</h3>
                <p className="text-slate-600 text-sm">{errorMsg}</p>
                <button onClick={reset} className="w-full py-3 bg-slate-900 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors">
                  Try Again
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-400">
            AarogyaVani AI · Runs entirely on your device · Not a replacement for medical advice.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;