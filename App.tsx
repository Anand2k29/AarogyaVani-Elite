import React, { useState, useRef, useEffect } from 'react';
import { analyzePrescription } from './services/geminiService';
import { AarogyaResponse, AppState, HistoryItem } from './types';
import LanguageSelector from './components/LanguageSelector';
import PrescriptionResult from './components/PrescriptionResult';
import HistoryList from './components/HistoryList';
import { UploadIcon, CameraIcon, LoadingSpinner, PillIcon } from './components/Icons';

const HISTORY_KEY = 'aarogya_history';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('hi');
  const [result, setResult] = useState<AarogyaResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isFreshAnalysis, setIsFreshAnalysis] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const addToHistory = (data: AarogyaResponse) => {
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      data: data
    };
    
    const updatedHistory = [newItem, ...history].slice(0, 10); // Keep last 10
    setHistory(updatedHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setResult(item.data);
    setIsFreshAnalysis(false);
    setAppState(AppState.SUCCESS);
  };

  const getPreviousMedicines = (): string[] => {
    // Extract all unique medicine names from history
    const meds = new Set<string>();
    history.forEach(item => {
      item.data.structured_data.medicines.forEach(m => meds.add(m.name));
    });
    return Array.from(meds);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAppState(AppState.ANALYZING);
    setErrorMsg(null);
    setIsFreshAnalysis(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      
      // Get previous medicines from history for interaction checking
      const previousMeds = getPreviousMedicines();

      try {
        const data = await analyzePrescription(base64Data, selectedLanguage, previousMeds);
        setResult(data);
        addToHistory(data);
        setAppState(AppState.SUCCESS);
      } catch (err: any) {
        console.error(err);
        setAppState(AppState.ERROR);
        setErrorMsg(err.message || "Failed to analyze prescription. Please ensure the image is clear.");
      }
    };
    reader.readAsDataURL(file);
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setResult(null);
    setErrorMsg(null);
    setIsFreshAnalysis(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={resetApp}>
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white">
                <PillIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Aarogya<span className="text-teal-600">Vani</span></h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8">
        
        {appState === AppState.IDLE && (
          <div className="w-full max-w-lg space-y-8 text-center animate-fade-in">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                Understand your prescription <br/><span className="text-teal-600">instantly.</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-md mx-auto">
                Upload a photo of your doctor's note. We'll decode the handwriting and translate it into simple spoken instructions.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 space-y-6">
              
              <LanguageSelector 
                selected={selectedLanguage} 
                onChange={setSelectedLanguage} 
              />

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative flex items-center justify-center gap-3 w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  <CameraIcon className="w-6 h-6" />
                  <span>Take Photo / Upload</span>
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

              <p className="text-xs text-slate-400 mt-2">
                Supported formats: JPG, PNG. ensure good lighting for best results.
              </p>
            </div>
            
            <HistoryList 
                history={history} 
                onSelect={handleSelectHistory} 
                onDelete={handleDeleteHistory}
            />
          </div>
        )}

        {appState === AppState.ANALYZING && (
          <div className="flex flex-col items-center justify-center space-y-6 text-center animate-pulse">
            <div className="relative">
              <div className="absolute inset-0 bg-teal-200 rounded-full opacity-20 animate-ping"></div>
              <div className="relative bg-white p-4 rounded-full shadow-xl">
                 <LoadingSpinner className="w-12 h-12 text-teal-600" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Analyzing Prescription...</h3>
              <p className="text-slate-500 mt-2">Deciphering handwriting & translating to {selectedLanguage}...</p>
            </div>
          </div>
        )}

        {appState === AppState.ERROR && (
          <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-lg border-l-4 border-red-500 text-center space-y-4 animate-shake">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-900">Analysis Failed</h3>
                <p className="text-slate-600 mt-1">{errorMsg}</p>
            </div>
            
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-left">
                <h4 className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Tips for a better scan:
                </h4>
                <ul className="text-sm text-orange-800/80 space-y-1.5 ml-1 list-disc list-inside marker:text-orange-400">
                    <li>Ensure the room is <strong>well-lit</strong>.</li>
                    <li>Hold the camera <strong>steady</strong> directly above.</li>
                    <li>Ensure the handwriting is <strong>in focus</strong>.</li>
                    <li>Avoid <strong>shadows</strong> covering the text.</li>
                </ul>
            </div>

            <button 
              onClick={resetApp}
              className="mt-4 w-full px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors shadow-lg hover:shadow-xl transform active:scale-[0.98]"
            >
              Try Again
            </button>
          </div>
        )}

        {appState === AppState.SUCCESS && result && (
          <PrescriptionResult data={result} onReset={resetApp} autoPlaySuccess={isFreshAnalysis} />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-400">
            AarogyaVani AI • Not a replacement for professional medical advice.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;