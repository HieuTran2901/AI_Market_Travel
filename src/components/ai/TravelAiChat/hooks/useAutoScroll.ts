import { useEffect, RefObject } from 'react';
import { TravelChatMessage } from '../types/chat.types';

export const useAutoScroll = (
  messagesEndRef: RefObject<HTMLDivElement | null>,
  messages: TravelChatMessage[],
  isLoading: boolean,
  isVisible: boolean
) => {
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading, isVisible, messagesEndRef]);
};
