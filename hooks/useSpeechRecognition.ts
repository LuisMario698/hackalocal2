import { useState, useRef } from 'react';
import { Audio } from 'expo-av';

interface UseSpeechRecognitionProps {
  openaiApiKey: string;
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
  openaiApiKey,
  language = 'es',
}: UseSpeechRecognitionProps): UseSpeechRecognitionResult => {
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

      // Enviar a OpenAI Whisper
      const formData = new FormData();
      formData.append('file', new File([Buffer.from(base64, 'base64')], 'audio.wav', { type: 'audio/wav' }));
      formData.append('model', 'whisper-1');
      formData.append('language', language);

      const transcribeResponse = await fetch(
        'https://api.openai.com/v1/audio/transcriptions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: formData,
        }
      );

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json();
        setError(`Error OpenAI: ${errorData.error?.message || 'desconocido'}`);
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
