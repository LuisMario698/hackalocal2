import { useState, useRef } from 'react';
import { Platform } from 'react-native';
import Voice from '@react-native-community/voice';

interface UseSpeechRecognitionProps {
  language?: string;
}

interface UseSpeechRecognitionResult {
  transcript: string;
  isRecording: boolean;
  isLoading: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  resetTranscript: () => void;
  error: string | null;
}

let webSpeechRecognition: any = null;

export const useSpeechRecognition = ({
  language = 'es-ES',
}: UseSpeechRecognitionProps = {}): UseSpeechRecognitionResult => {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const webRecognitionRef = useRef<any>(null);

  // Web Speech API para navegadores
  const initWebSpeechAPI = () => {
    if (typeof window === 'undefined') return null;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Web Speech API no soportado en este navegador');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      setError(`Error STT: ${event.error}`);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    return recognition;
  };

  // STT nativo para móvil (iOS/Android)
  const initMobileVoice = async () => {
    try {
      await Voice.start(language);
      setIsRecording(true);
      setError(null);
    } catch (err: any) {
      setError(`Error al iniciar STT: ${err.message}`);
    }
  };

  const stopMobileVoice = async () => {
    try {
      setIsLoading(true);
      await Voice.stop();
      // El resultado viene en el callback onSpeechResults
    } catch (err: any) {
      setError(`Error al detener STT: ${err.message}`);
    } finally {
      setIsRecording(false);
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript('');

      if (Platform.OS === 'web') {
        const recognition = initWebSpeechAPI();
        if (recognition) {
          webRecognitionRef.current = recognition;
          recognition.start();
        }
      } else {
        // iOS/Android
        await Voice.start(language);
        setIsRecording(true);
      }
    } catch (err: any) {
      setError(`Error iniciando grabación: ${err.message}`);
    }
  };

  const stopRecording = async () => {
    try {
      setIsLoading(true);

      if (Platform.OS === 'web') {
        if (webRecognitionRef.current) {
          webRecognitionRef.current.stop();
        }
      } else {
        // iOS/Android - el resultado viene en el event listener
        await Voice.stop();
      }
    } catch (err: any) {
      setError(`Error deteniendo grabación: ${err.message}`);
    } finally {
      setIsRecording(false);
      setIsLoading(false);
    }
  };

  const resetTranscript = () => {
    setTranscript('');
    setError(null);
  };

  // Setup Voice listeners para móvil
  if (Platform.OS !== 'web') {
    const setupVoiceListeners = () => {
      Voice.onSpeechStart = () => {
        setIsRecording(true);
        setError(null);
      };

      Voice.onSpeechRecognized = () => {
        setIsLoading(true);
      };

      Voice.onSpeechEnd = () => {
        setIsRecording(false);
      };

      Voice.onSpeechResults = (event: any) => {
        setTranscript(event.value?.[0] || '');
        setIsLoading(false);
      };

      Voice.onSpeechError = (event: any) => {
        setError(`Error: ${event.error?.message || 'Error desconocido'}`);
        setIsLoading(false);
      };
    };

    // Llamar una sola vez
    if (!webSpeechRecognition) {
      setupVoiceListeners();
      webSpeechRecognition = true;
    }
  }

  return {
    transcript,
    isRecording,
    isLoading,
    startRecording,
    stopRecording,
    resetTranscript,
    error,
  };
};
