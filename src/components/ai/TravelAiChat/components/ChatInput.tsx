import React from 'react';
import { motion, Variants } from 'framer-motion';
import { X, Paperclip, Send, Loader2, Image } from 'lucide-react';
import { ChatAttachment, ChatTransitionState } from '../types/chat.types';

export interface ChatInputProps {
  uploadError: string;
  input: string;
  setInput: (input: string) => void;
  resizeComposer: (node: HTMLTextAreaElement) => void;
  sendMessage: (message?: string) => void;
  canSend: boolean;
  workingMode: boolean;
  isLoading: boolean;
  attachments: ChatAttachment[];
  MAX_IMAGES: number;
  addFiles: (files: FileList) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  revealVariants: Variants;
  chatState: ChatTransitionState;
  removeAttachment: (id: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  suggestionChips: string[];
  isDragging?: boolean;
}

const AttachmentPreview = ({ attachments, onRemove }: { attachments: ChatAttachment[]; onRemove: (id: string) => void }) => {
  if (attachments.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="motion-upload-preview relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/10">
          <img src={attachment.previewUrl} alt={attachment.file.name} className="h-full w-full object-cover" />
          {attachment.status === 'uploading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
          <button
            type="button"
            onClick={() => onRemove(attachment.id)}
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-950/70 text-white transition hover:bg-red-500"
            aria-label={`Remove ${attachment.file.name}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
};

export const ChatInput = ({
  uploadError,
  input,
  setInput,
  resizeComposer,
  sendMessage,
  canSend,
  isLoading,
  attachments,
  addFiles,
  textareaRef,
  fileInputRef,
  revealVariants,
  chatState,
  removeAttachment,
  handleKeyDown,
  suggestionChips,
  isDragging
}: ChatInputProps) => {
  return (
    <motion.div
      className="border-t border-white/10 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-3"
      variants={revealVariants}
      initial="hidden"
      animate={chatState === 'closing' ? 'closing' : 'visible'}
      custom={0.58}
    >
      {isDragging && <div className="mb-2 rounded-2xl border border-dashed border-cyan-300/70 bg-cyan-300/10 px-3 py-2 text-center text-xs font-bold text-cyan-100">Drop travel images here</div>}
      <AttachmentPreview attachments={attachments} onRemove={removeAttachment} />
      {uploadError && <p className="mb-2 px-2 text-xs font-semibold text-rose-200">{uploadError}</p>}
      
      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage(input);
        }}
        className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/8 p-2 shadow-inner focus-within:border-blue-300/50"
      >
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => event.target.files && addFiles(event.target.files)} />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-blue-100 transition hover:bg-white/10" aria-label="Attach image">
          <Paperclip className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-blue-100 transition hover:bg-white/10" aria-label="Pick image">
          <Image className="h-4 w-4" />
        </button>
        
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            resizeComposer(event.target);
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask about trips, hotels, food, routes..."
          className="min-h-[42px] max-h-[104px] flex-1 resize-none overflow-y-auto border-0 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-blue-100/55 focus:ring-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        />
        
        <button
          type="submit"
          disabled={!canSend || isLoading}
          className="travel-ai-send-button flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-violet-500 text-white shadow-lg shadow-violet-950/30 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </form>

      <motion.div variants={revealVariants} initial="hidden" animate={chatState === 'closing' ? 'closing' : 'visible'} custom={0.62} className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {suggestionChips.slice(0, 5).map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => sendMessage(suggestion)}
            className="shrink-0 rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs font-semibold text-blue-100 transition hover:bg-white/14"
          >
            {suggestion}
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
};
