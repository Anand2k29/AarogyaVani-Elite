import React, { useEffect, useState } from 'react';
import { AarogyaResponse } from '../types';
import { PillIcon, WarningIcon, ScanIcon } from './Icons';
import AudioPlayer from './AudioPlayer';
import PillIdentifierModal from './PillIdentifierModal';
import { SUPPORTED_LANGUAGES, TTS_LOCALE_MAP } from '../constants';

interface Props {
  data: AarogyaResponse;
  onReset: () => void;
  autoPlaySuccess?: boolean;
}

const PrescriptionResult: React.FC<Props> = ({ data, onReset, autoPlaySuccess }) => {
  const languageName = SUPPORTED_LANGUAGES.find(l => l.code === data.language)?.name || data.language;
  const interactions = data.structured_data.interactions || [];
  const [selectedMedicineForId, setSelectedMedicineForId] = useState<string | null>(null);

  useEffect(() => {
    if (autoPlaySuccess && data.success_message && 'speechSynthesis' in window) {
        // Simple auto-play for success message
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(data.success_message);
        utterance.lang = TTS_LOCALE_MAP[data.language] || data.language;
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    }
  }, [autoPlaySuccess, data]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-fade-in-up">
      
      {/* Interaction Warnings */}
      {interactions.length > 0 && (
        <div className="bg-red-50 rounded-2xl border border-red-200 overflow-hidden shadow-sm animate-pulse-once">
          <div className="p-4 bg-red-100 flex items-center gap-3">
             <WarningIcon className="w-6 h-6 text-red-600" />
             <h3 className="text-lg font-bold text-red-800">Safety Alerts Detected</h3>
          </div>
          <div className="p-5 space-y-4">
             {interactions.map((interaction, idx) => (
               <div key={idx} className="bg-white p-4 rounded-xl border border-red-100 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                     <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                        interaction.severity === 'HIGH' ? 'bg-red-600 text-white' : 
                        interaction.severity === 'MODERATE' ? 'bg-orange-500 text-white' : 
                        'bg-yellow-400 text-black'
                     }`}>
                        {interaction.severity} Risk
                     </span>
                     <span className="text-xs text-slate-400">Interaction</span>
                  </div>
                  <p className="font-semibold text-slate-800 mb-1">
                     {interaction.medicines.join(' + ')}
                  </p>
                  <p className="text-slate-600 text-sm">
                     {interaction.description}
                  </p>
               </div>
             ))}
             <p className="text-xs text-red-700 font-medium mt-2">
                * Please discuss these interactions with your doctor before starting the medication.
             </p>
          </div>
        </div>
      )}

      {/* Voice Companion Section */}
      <div className="bg-white rounded-2xl shadow-xl border border-teal-100 overflow-hidden">
        <div className="bg-teal-600 p-4 sm:p-6 text-white">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <span role="img" aria-label="voice">🗣️</span> Voice Companion
          </h2>
          <p className="opacity-90 text-sm sm:text-base mt-1">
            Listen to the instructions in your language.
          </p>
        </div>
        
        <div className="p-6 space-y-6">
           {/* Native Script */}
           <div className="bg-teal-50 rounded-xl p-5 border border-teal-100">
             <h3 className="text-teal-900 font-semibold mb-2 text-lg">In {languageName}</h3>
             <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
               {data.voice_script_native}
             </p>
             <div className="mt-4">
                <AudioPlayer 
                    text={data.voice_script_native} 
                    langCode={data.language} 
                    label={languageName} 
                />
             </div>
           </div>

           {/* English Script */}
           <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
             <h3 className="text-slate-700 font-semibold mb-2">English Summary</h3>
             <p className="text-slate-600 leading-relaxed">
               {data.voice_script_english}
             </p>
           </div>
        </div>
      </div>

      {/* Structured Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
             <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <PillIcon className="w-6 h-6" />
             </div>
             <h2 className="text-xl font-bold text-slate-800">Medicine Details</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold border-b border-slate-200">Medicine</th>
                <th className="p-4 font-semibold border-b border-slate-200">Dosage</th>
                <th className="p-4 font-semibold border-b border-slate-200">Timing</th>
                <th className="p-4 font-semibold border-b border-slate-200">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.structured_data.medicines.map((med, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-900 group relative">
                    <div className="flex items-center gap-2">
                        {med.name}
                        <button 
                            onClick={() => setSelectedMedicineForId(med.name)}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Identify this pill"
                        >
                            <ScanIcon className="w-5 h-5" />
                        </button>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{med.dosage}</td>
                  <td className="p-4 text-slate-600">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {med.timing}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 text-sm italic">{med.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.structured_data.patientNotes && (
          <div className="p-4 bg-yellow-50 border-t border-yellow-100 text-yellow-800 text-sm flex gap-2">
            <span className="font-bold">Note:</span> {data.structured_data.patientNotes}
          </div>
        )}
      </div>

      <div className="flex justify-center pb-8">
        <button 
          onClick={onReset}
          className="text-slate-500 hover:text-slate-800 underline decoration-slate-300 underline-offset-4 transition-all"
        >
          Scan Another Prescription
        </button>
      </div>

      {selectedMedicineForId && (
        <PillIdentifierModal
            medicineName={selectedMedicineForId}
            language={data.language}
            onClose={() => setSelectedMedicineForId(null)}
        />
      )}
    </div>
  );
};

export default PrescriptionResult;