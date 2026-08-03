import { X, Loader2 } from 'lucide-react';
import { ChatAttachment } from '../types/chat.types';

export const AttachmentPreview = ({ attachments, onRemove }: { attachments: ChatAttachment[]; onRemove: (id: string) => void }) => {
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

