import { useState, useEffect, useRef } from 'react';

export function useSpeechCommand({ onCaliperDetected, onNextCommand }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [detectedCommand, setDetectedCommand] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition is not supported in this environment.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'id-ID'; // Supports Indonesian transcription

    rec.onresult = (event) => {
      const resultIndex = event.results.length - 1;
      const text = event.results[resultIndex][0].transcript.toLowerCase().trim();
      setTranscript(text);

      // 1. Detect navigation commands
      if (
        text.includes('next') || 
        text.includes('lanjut') || 
        text.includes('selanjutnya') ||
        text.includes('berikutnya')
      ) {
        setDetectedCommand('Perintah: Ke Layar Selanjutnya');
        if (onNextCommand) {
          onNextCommand();
        }
        return;
      }

      // 2. Detect caliper / numeric values
      // Speech recognition in Indonesian uses comma as decimal separator (e.g. "25,4")
      const formatted = text.replace(/,/g, '.');
      const numberPattern = /(\d+[\.]?\d*)/;
      const match = formatted.match(numberPattern);

      if (match) {
        const val = parseFloat(match[1]);
        if (!isNaN(val)) {
          setDetectedCommand(`Nilai Kaliper: ${val.toFixed(2)} mm`);
          if (onCaliperDetected) {
            onCaliperDetected(val);
          }
        }
      } else {
        setDetectedCommand('Suara terdengar, angka tidak terdeteksi.');
      }
    };

    rec.onend = () => {
      // Auto-restart while isListening is true
      if (isListening) {
        try {
          rec.start();
        } catch (e) {
          console.warn("Speech restart failed:", e);
        }
      }
    };

    recognitionRef.current = rec;

    if (isListening) {
      try {
        rec.start();
      } catch (e) {
        console.error("Speech start failed:", e);
      }
    } else {
      try {
        rec.stop();
      } catch (e) {}
    }

    return () => {
      try {
        rec.stop();
      } catch (e) {}
    };
  }, [isListening, onCaliperDetected, onNextCommand]);

  const toggleListening = () => {
    setIsListening(prev => !prev);
    if (!isListening) {
      setTranscript('Mulai mendengarkan...');
      setDetectedCommand('');
    } else {
      setTranscript('');
      setDetectedCommand('Mikrofon Mati');
    }
  };

  return { 
    isListening, 
    transcript, 
    detectedCommand, 
    toggleListening,
    setDetectedCommand
  };
}
