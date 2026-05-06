'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface ChatPanelProps {
  messages: ChatMessage[];
  isOwner: boolean;
  currentUserName: string;
  onSend: (content: string) => void;
  onDelete: (messageId: string) => void;
}

function formatMsgTime(date: string) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPanel({ messages, isOwner, currentUserName, onSend, onDelete }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
    setShowEmoji(false);
  }, [input, onSend]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-none px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Live Chat
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin">
        {messages.length === 0 && (
          <div className="text-center text-white/30 text-sm py-8">
            No messages yet. Say hello!
          </div>
        )}
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            msg={msg}
            isOwner={isOwner}
            isMe={msg.senderName === currentUserName}
            onDelete={onDelete}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Emoji picker */}
      {showEmoji && (
        <div className="relative flex-none">
          <div
            className="absolute bottom-2 right-2 z-50"
            onMouseLeave={() => setShowEmoji(false)}
          >
            <EmojiPicker
              onEmojiClick={(e) => {
                setInput((p) => p + e.emoji);
                inputRef.current?.focus();
              }}
              theme={'dark' as any}
              height={350}
            />
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-none px-3 pb-3 pt-2 border-t border-white/10">
        <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 focus-within:border-violet-500/60 transition-colors">
          <button
            onClick={() => setShowEmoji((v) => !v)}
            className="text-white/40 hover:text-white/70 text-lg transition-colors flex-none"
            title="Emoji"
          >
            😊
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Say something..."
            maxLength={500}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex-none text-violet-400 hover:text-violet-300 disabled:opacity-30 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageItem({
  msg,
  isOwner,
  isMe,
  onDelete,
}: {
  msg: ChatMessage;
  isOwner: boolean;
  isMe: boolean;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  if (msg.isRemoved) {
    return (
      <div className="px-2 py-1">
        <span className="text-xs text-white/20 italic">This message was removed by the owner.</span>
      </div>
    );
  }

  return (
    <div
      className={cn('group flex flex-col px-2 py-1 rounded-lg hover:bg-white/5 transition-colors', isMe && 'items-end')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={cn('flex items-center gap-1.5 mb-0.5', isMe && 'flex-row-reverse')}>
        <span className={cn('text-xs font-semibold', isMe ? 'text-violet-400' : 'text-cyan-400')}>
          {msg.senderName}
        </span>
        {msg.isOwner && (
          <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">HOST</span>
        )}
        <span className="text-[10px] text-white/25">{formatMsgTime(msg.createdAt)}</span>
        {isOwner && !isMe && hovered && (
          <button
            onClick={() => onDelete(msg.id)}
            className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors ml-1"
          >
            remove
          </button>
        )}
      </div>
      <p className={cn(
        'text-sm text-white/85 max-w-[85%] break-words leading-relaxed',
        isMe && 'bg-violet-600/20 rounded-xl rounded-tr-sm px-3 py-1.5',
        !isMe && 'bg-white/5 rounded-xl rounded-tl-sm px-3 py-1.5',
      )}>
        {msg.content}
      </p>
    </div>
  );
}
