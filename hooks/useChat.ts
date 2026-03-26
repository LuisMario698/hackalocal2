import { useCallback, useState } from 'react';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface UseChatOptions {
  userId: string;
  userRole: 'client' | 'association' | 'admin';
}

export function useChat({ userId, userRole }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: `local-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/chat-agent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            message: text.trim(),
            user_role: userRole,
            user_id: userId,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Error ${res.status}`);
        }

        const data = await res.json();

        if (data.conversation_id && !conversationId) {
          setConversationId(data.conversation_id);
        }

        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.message,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: any) {
        setError(err.message || 'Error de conexión');
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Lo siento, hubo un problema de conexión. Intenta de nuevo.',
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, isLoading, userId, userRole]
  );

  const resetChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, resetChat, conversationId };
}
