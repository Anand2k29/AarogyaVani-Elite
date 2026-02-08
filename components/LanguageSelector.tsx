import React from 'react';
import { SUPPORTED_LANGUAGES } from '../constants';

interface Props {
  selected: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}

const LanguageSelector: React.FC<Props> = ({ selected, onChange, disabled }) => {
  return (
    <div className="w-full">
      <label htmlFor="language" className="block text-sm font-medium text-slate-700 mb-2">
        Translate Instructions To:
      </label>
      <div className="relative">
        <select
          id="language"
          value={selected}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="block w-full rounded-xl border-slate-300 bg-white py-3 pl-4 pr-10 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-teal-600 sm:text-sm sm:leading-6 disabled:bg-slate-100 disabled:text-slate-400 appearance-none cursor-pointer"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.nativeName} ({lang.name})
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
           <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
           </svg>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;