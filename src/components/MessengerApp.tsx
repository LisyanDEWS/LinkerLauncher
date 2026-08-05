import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, File, Image as ImageIcon, X, Paperclip, Loader2, User, Download } from 'lucide-react';
import { pb } from '../lib/pocketbase';

interface Message {
  id: string;
  username: string;
  messenger_text: string;
  messenger_files: string[];
  created: string;
}

export function MessengerApp({ lang, nickname }: { lang: 'ru' | 'en'; nickname: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const t = {
    title: lang === 'ru' ? 'Мессенджер' : 'Messenger',
    placeholder: lang === 'ru' ? 'Напишите сообщение...' : 'Type a message...',
    send: lang === 'ru' ? 'Отправить' : 'Send',
    files: lang === 'ru' ? 'файлов' : 'files',
    noMessages: lang === 'ru' ? 'Нет сообщений' : 'No messages',
    loading: lang === 'ru' ? 'Загрузка...' : 'Loading...',
  };

  useEffect(() => {
    // Initial fetch
    const fetchMessages = async () => {
      try {
        const records = await pb.collection('messages').getList(1, 50, {
          sort: '-created',
        });
        // We want them in chronological order for the UI
        setMessages(records.items.reverse() as any);
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Real-time subscription
    pb.collection('messages').subscribe('*', (e) => {
      if (e.action === 'create') {
        setMessages((prev) => [...prev, e.record as any]);
      } else if (e.action === 'delete') {
        setMessages((prev) => prev.filter((m) => m.id !== e.record.id));
      } else if (e.action === 'update') {
        setMessages((prev) => prev.map((m) => (m.id === e.record.id ? (e.record as any) : m)));
      }
    });

    return () => {
      pb.collection('messages').unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && selectedFiles.length === 0) return;
    if (isSending) return;

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('username', nickname);
      formData.append('messenger_text', inputText);
      
      selectedFiles.forEach((file) => {
        formData.append('messenger_files', file);
      });

      await pb.collection('messages').create(formData);
      
      setInputText('');
      setSelectedFiles([]);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileUrl = (message: Message, filename: string) => {
    return pb.getFileUrl(message as any, filename);
  };

  const isImage = (filename: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--surface)] text-[var(--on-surface)]">
      {/* Header is handled by WindowManager */}
      
      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[var(--outline-var)]"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full gap-2 opacity-50">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs font-bold">{t.loading}</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full opacity-30 text-xs font-bold">
            {t.noMessages}
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.username === nickname ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className="text-[10px] font-black uppercase tracking-wider opacity-50">
                  {msg.username}
                </span>
                <span className="text-[9px] opacity-30">
                  {new Date(msg.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              <div 
                className={`max-w-[85%] p-3 rounded-2xl border border-[var(--outline-var)] shadow-sm ${
                  msg.username === nickname 
                    ? 'bg-[var(--primary)] text-white rounded-tr-none' 
                    : 'bg-[var(--container)] text-[var(--on-surface)] rounded-tl-none'
                }`}
              >
                {msg.messenger_text && (
                  <p className="text-sm font-medium whitespace-pre-wrap break-words">
                    {msg.messenger_text}
                  </p>
                )}
                
                {msg.messenger_files && msg.messenger_files.length > 0 && (
                  <div className={`mt-2 space-y-2 ${msg.messenger_text ? 'pt-2 border-t border-white/10' : ''}`}>
                    {msg.messenger_files.map((file, i) => (
                      <div key={i} className="group relative">
                        {isImage(file) ? (
                          <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/5">
                            <img 
                              src={getFileUrl(msg, file)} 
                              alt="attached" 
                              className="max-w-full max-h-64 object-contain"
                            />
                            <a 
                              href={getFileUrl(msg, file)} 
                              download 
                              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Download size={20} className="text-white" />
                            </a>
                          </div>
                        ) : (
                          <a 
                            href={getFileUrl(msg, file)} 
                            download
                            className="flex items-center gap-2 p-2 rounded-lg bg-black/10 hover:bg-black/20 transition-colors border border-white/5"
                          >
                            <File size={14} className="shrink-0" />
                            <span className="text-[10px] font-bold truncate max-w-[150px]">{file}</span>
                            <Download size={12} className="ml-auto opacity-50" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[var(--outline-var)] bg-[var(--surface-dim)]">
        <AnimatePresence>
          {selectedFiles.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-wrap gap-2 mb-3 overflow-hidden"
            >
              {selectedFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[var(--container)] border border-[var(--outline-var)] text-[10px] font-bold">
                  {file.type.startsWith('image/') ? <ImageIcon size={12} /> : <File size={12} />}
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <button onClick={() => removeFile(i)} className="p-0.5 hover:bg-black/10 rounded-md">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSend} className="flex items-end gap-2">
          <div className="relative flex-1 flex items-end bg-[var(--surface)] border border-[var(--outline)] rounded-2xl focus-within:border-[var(--primary)] transition-colors overflow-hidden">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.placeholder}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              className="flex-1 max-h-32 p-3 text-sm font-medium bg-transparent outline-none resize-none scrollbar-none"
            />
            
            <div className="flex items-center px-2 pb-2">
              <label className="p-2 cursor-pointer text-[var(--on-surface-var)] hover:text-[var(--on-surface)] transition-colors rounded-xl hover:bg-[var(--container)]">
                <Paperclip size={18} />
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files) {
                      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }} 
                />
              </label>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isSending || (!inputText.trim() && selectedFiles.length === 0)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20 disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95 transition-all"
          >
            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
