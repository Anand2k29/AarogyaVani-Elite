/**
 * AarogyaVani – Browser Native Audio Service
 * ============================================
 * Uses window.speechSynthesis to provide natural voice readout
 * of deciphered prescriptions in native languages.
 */

export function speakInstructions(text: string, languageCode: string) {
    if (!window.speechSynthesis) {
        console.warn("speechSynthesis is not supported in this browser.");
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Convert short language names into standard language tags used by voices
    let langTag = 'en-US';
    switch (languageCode.toLowerCase()) {
        case 'hindi': langTag = 'hi-IN'; break;
        case 'kannada': langTag = 'kn-IN'; break;
        case 'telugu': langTag = 'te-IN'; break;
        case 'tamil': langTag = 'ta-IN'; break;
        case 'marathi': langTag = 'mr-IN'; break;
        case 'bengali': langTag = 'bn-IN'; break;
        case 'gujarati': langTag = 'gu-IN'; break;
        case 'malayalam': langTag = 'ml-IN'; break;
        default: langTag = 'en-US'; break;
    }

    utterance.lang = langTag;
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;

    // Optional: Try to find a high quality local voice matching the tag
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes(langTag) && v.localService);
    if (preferredVoice) {
        utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
}
