import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Loader2, Sparkles } from 'lucide-react';
import { aiService } from '../../../services/aiService';
import { AssistantMessage } from '../../../types/ai';
import { Button } from '../../../components/ui/Button';

export const AiAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    { role: 'assistant', content: 'Hi there! I am your personal AI travel assistant. Where would you like to go, or what kind of trip are you planning?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState<string[]>(['Recommend a hotel in Hanoi', 'What is the best time to visit Da Nang?']);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: AssistantMessage = { role: 'user', content: text };
    const newHistory = [...messages, userMsg];
    
    setMessages(newHistory);
    setInput('');
    setSuggestedActions([]);
    setIsLoading(true);

    try {
      const response = await aiService.chatWithAssistant({
        message: text,
        history: messages
      });

      setMessages([...newHistory, { role: 'assistant', content: response.message || response.reply || 'I found a travel response for you.' }]);
      if (response.suggestions || response.suggestedActions) {
        setSuggestedActions(response.suggestions || response.suggestedActions || []);
      }
    } catch (error) {
      console.error('Failed to chat:', error);
      setMessages([...newHistory, { role: 'assistant', content: 'Sorry, I am having trouble connecting to the travel brain right now. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Travel Assistant <Sparkles className="w-4 h-4 text-amber-300" />
            </h1>
            <p className="text-blue-100 text-sm opacity-90">Always here to help you plan</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              
              <div className={`px-5 py-3.5 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'}`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>

            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div className="px-5 py-4 rounded-2xl bg-white shadow-sm border border-gray-100 rounded-tl-sm flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <span className="text-gray-500 text-sm font-medium">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        
        {/* Suggested Actions */}
        {suggestedActions.length > 0 && !isLoading && (
          <div className="flex flex-wrap gap-2 mb-4 px-2">
            {suggestedActions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleSend(action)}
                className="text-xs font-medium px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-full transition-colors border border-indigo-100"
              >
                {action}
              </button>
            ))}
          </div>
        )}

        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="flex gap-3 relative items-end bg-slate-50 p-2 rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            placeholder="Ask me anything about travel..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent border-0 focus:ring-0 resize-none py-2.5 px-4 text-gray-900 placeholder-gray-400"
            rows={1}
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 w-12 flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:bg-gray-400"
          >
            <Send className="w-5 h-5 ml-1" />
          </Button>
        </form>
        <p className="text-center text-[11px] text-gray-400 mt-3 font-medium">AI can make mistakes. Check important information like flight times and visa requirements.</p>
      </div>

    </div>
  );
};
