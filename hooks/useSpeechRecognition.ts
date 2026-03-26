import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

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

// Recording options that produce Whisper-compatible formats
const RECORDING_OPTIONS: Audio.RecordingOptions = Platform.OS === 'ios'
  ? {
      isMeteringEnabled: true,
      android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 128000,
      },
    }
  : {
      isMeteringEnabled: true,
      android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 128000,
      },
    };

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

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(RECORDING_OPTIONS);
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
      recordingRef.current = null;

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

      // Enviar a Edge Function
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

      const transcribeResponse = await fetch(
        `${supabaseUrl}/functions/v1/transcribe-audio`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
            apikey: supabaseAnonKey,
          },
          body: JSON.stringify({ audio_base64: base64 }),
        }
      );

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json().catch(() => ({}));
        setError(`Error: ${errorData.error || 'No se pudo transcribir el audio'}`);
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
