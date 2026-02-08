import React from 'react';
import { HistoryItem } from '../types';
import { ClockIcon, PillIcon, TrashIcon } from './Icons';
import { SUPPORTED_LANGUAGES } from '../constants';

interface Props {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

const HistoryList: React.FC<Props> = ({ history, onSelect, onDelete }) => {
  if (history.length === 0) return null;

  return (
    <div className="w-full max-w-lg mt-8 animate-fade-in">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <ClockIcon className="w-5 h-5 text-slate-500" />
        Recent Scans
      </h3>
      <div className="space-y-3">
        {history.map((item) => {
          const langName = SUPPORTED_LANGUAGES.find(l => l.code === item.data.language)?.name || item.data.language;
          const medicineCount = item.data.structured_data.medicines.length;
          const date = new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

          return (
            <div 
              key={item.id} 
              onClick={() => onSelect(item)}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-200 transition-all cursor-pointer flex justify-between items-center group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600">
                  <PillIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {medicineCount} {medicineCount === 1 ? 'Medicine' : 'Medicines'} Found
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{date}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>{langName}</span>
                  </p>
                </div>
              </div>
              
              <button
                onClick={(e) => onDelete(item.id, e)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Delete from history"
                aria-label="Delete history item"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryList;