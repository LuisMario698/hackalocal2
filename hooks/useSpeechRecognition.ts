import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { supabase } from '../lib/supabase';

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

export const useSpeechRecognition = ({
  language = 'es',
}: UseSpeechRecognitionProps = {}): UseSpeechRecognitionResult => {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = async () => {
    try {
      setError(null);
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setError('Permiso de micrófono denegado');
        return;
      }

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err: any) {
      setError(`Error al grabar: ${err.message}`);
    }
  };

  const stopRecording = async () => {
    try {
      setIsLoading(true);
      if (!recordingRef.current) return;

      await recordingRef.current.stopAndUnloadAsync();
      setIsRecording(false);

      const uri = recordingRef.current.getURI();
      if (!uri) {
        setError('Error: no se grabó audio');
        return;
      }

      // Convertir URI a base64
      const response = await fetch(uri);
      const blob = await response.blob();

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Enviar a Edge Function (que tiene la API key de OpenAI)
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || '';

      const transcribeResponse = await fetch(
        `${supabaseUrl}/functions/v1/transcribe-audio`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ audio_base64: base64 }),
        }
      );

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json();
        setError(`Error: ${errorData.error || 'desconocido'}`);
        return;
      }

      const result = await transcribeResponse.json();
      setTranscript(result.text || '');
    } catch (err: any) {
      setError(`Error al transcribir: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetTranscript = () => {
    setTranscript('');
    setError(null);
  };

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
