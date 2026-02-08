import React, { useState, useEffect } from 'react';
import { PlayIcon, StopIcon } from './Icons';
import { TTS_LOCALE_MAP } from '../constants';

interface AudioPlayerProps {
  text: string;
  langCode: string; // e.g., 'hi-IN' or 'en-US'
  label: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ text, langCode, label }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setSupported(false);
    }
  }, []);

  useEffect(() => {
    // Reset state if text changes
    setIsPlaying(false);
    window.speechSynthesis.cancel();
  }, [text]);

  const handlePlay = () => {
    if (!supported) return;

    window.speechSynthesis.cancel(); // Stop any current speech

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Map simplified language codes to full locale codes for better TTS support
    utterance.lang = TTS_LOCALE_MAP[langCode] || langCode;
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = (e) => {
      console.error("Speech synthesis error", e);
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  if (!supported) return null;

  return (
    <button
      onClick={isPlaying ? handleStop : handlePlay}
      className={`flex items-center gap-2 px-4 py-3 rounded-full font-medium transition-colors shadow-sm ${
        isPlaying 
          ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200' 
          : 'bg-teal-600 text-white hover:bg-teal-700 shadow-md'
      }`}
    >
      {isPlaying ? <StopIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
      <span>{isPlaying ? 'Stop' : `Listen (${label})`}</span>
    </button>
  );
};

export default AudioPlayer;