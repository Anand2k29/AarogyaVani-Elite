import React, { useState, useRef } from 'react';
import { CameraIcon, CloseIcon, LoadingSpinner, CheckCircleIcon, XCircleIcon, WarningIcon } from './Icons';
import { identifyPill } from '../services/geminiService';
import { PillAnalysisResult } from '../types';
import AudioPlayer from './AudioPlayer';

interface Props {
  medicineName: string;
  language: string;
  onClose: () => void;
}

const PillIdentifierModal: React.FC<Props> = ({ medicineName, language, onClose }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PillAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleIdentify = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);
    try {
      const base64Data = image.split(',')[1];
      const data = await identifyPill(base64Data, medicineName, language);
      setResult(data);
    } catch (err: any) {
      setError("Unable to identify pill. Please try again with a clearer image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Identify Pill</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          
          {/* Prominent Disclaimer */}
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
            <WarningIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
              <p className="font-bold mb-1">Medical Disclaimer</p>
              <p>
                AI identification is experimental and <strong>not a substitute for professional medical advice</strong>. 
                Visual matching can be inaccurate. Always verify the physical medicine with a qualified pharmacist or doctor before consumption.
              </p>
            </div>
          </div>

          <p className="text-slate-600 mb-4">
            Is this pill <strong>{medicineName}</strong>? Take a photo to check.
          </p>

          {!image ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-teal-600 hover:border-teal-400 hover:bg-teal-50 transition-all gap-2"
            >
              <CameraIcon className="w-8 h-8" />
              <span className="font-medium">Tap to take photo</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
            </button>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                 <img src={image} alt="Pill Preview" className="w-full h-full object-contain" />
                 {!result && !loading && (
                    <button 
                        onClick={() => { setImage(null); setResult(null); }}
                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                    >
                        <CloseIcon className="w-4 h-4" />
                    </button>
                 )}
              </div>

              {!result && !loading && (
                <button
                  onClick={handleIdentify}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors shadow-md"
                >
                  Verify Medicine
                </button>
              )}
            </div>
          )}

          {loading && (
            <div className="py-8 flex flex-col items-center justify-center text-teal-600 animate-pulse">
              <LoadingSpinner className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Analyzing shape, color & imprint...</span>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-4 space-y-4 animate-fade-in-up">
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                result.matchStatus === 'LIKELY_MATCH' ? 'bg-green-50 border-green-200 text-green-900' :
                result.matchStatus === 'POSSIBLE_MISMATCH' ? 'bg-red-50 border-red-200 text-red-900' :
                'bg-yellow-50 border-yellow-200 text-yellow-900'
              }`}>
                {result.matchStatus === 'LIKELY_MATCH' && <CheckCircleIcon className="w-6 h-6 shrink-0 text-green-600" />}
                {result.matchStatus === 'POSSIBLE_MISMATCH' && <XCircleIcon className="w-6 h-6 shrink-0 text-red-600" />}
                {result.matchStatus === 'UNCERTAIN' && <WarningIcon className="w-6 h-6 shrink-0 text-yellow-600" />}
                
                <div>
                  <h4 className="font-bold">
                    {result.matchStatus === 'LIKELY_MATCH' ? 'Likely Match' :
                     result.matchStatus === 'POSSIBLE_MISMATCH' ? 'Possible Mismatch' :
                     'Uncertain'}
                  </h4>
                  <p className="text-sm mt-1">{result.analysis}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl text-sm border border-slate-100">
                <p className="font-semibold text-slate-700 mb-1">Visual Description:</p>
                <p className="text-slate-600">{result.visualDescription}</p>
              </div>

               <div className="flex items-center justify-between bg-teal-50 p-3 rounded-xl">
                  <span className="text-sm font-medium text-teal-800">Listen to analysis</span>
                  <AudioPlayer text={result.voiceSummary} langCode={language} label="Result" />
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PillIdentifierModal;