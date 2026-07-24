import React, { useState } from 'react';
import { useP2P } from './lisyanconnect-useP2P';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, QrCode, LogOut, Loader2, Share2, UploadCloud, Smartphone, LogIn, ChevronRight, HelpCircle, CheckCircle } from 'lucide-react';

export function LisyanConnectModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { status, createRoom, joinRoom, sendFiles, receivedFiles, progress } = useP2P();
  const [roomId, setRoomId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [view, setView] = useState<'dashboard' | 'room'>('dashboard');

  const handleCreate = async () => {
    const id = await createRoom();
    setRoomId(id);
    setView('room');
  };

  const handleJoin = async () => {
    if (joinCode) {
      await joinRoom(joinCode);
      setRoomId(joinCode);
      setView('room');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      sendFiles(e.target.files);
    }
  };

  const handleExit = () => {
    setView('dashboard');
    setRoomId('');
    setJoinCode('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
          
          <div className="relative w-full max-w-4xl h-[90vh] sm:h-[80vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl bg-[var(--surface)] border border-[var(--outline)]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--outline-var)] bg-[var(--surface-dim)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-[2px] shadow-md">
                  <img src="https://github.com/user-attachments/assets/5708335a-e247-479e-b4f4-fce0ceae7567" alt="Logo" className="w-full h-full rounded-full object-cover" />
                </div>
                <h1 className="text-lg font-bold tracking-tight text-[var(--on-surface)]">Lisyan Connect</h1>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--surface-container)] text-[var(--on-surface-var)] hover:bg-[var(--surface-container-high)] hover:text-[var(--on-surface)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col gap-6">
              
              {view === 'dashboard' && (
                <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full mt-8">
                  <div className="flex items-center gap-4 bg-[var(--surface-container)] p-4 rounded-2xl border border-[var(--outline-var)]">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--surface-dim)] text-[var(--on-surface)]">
                      <Smartphone size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[var(--on-surface)]">Your Device</h3>
                      <p className="text-[10px] font-bold opacity-50 uppercase tracking-tighter text-[var(--on-surface-var)]">Ready to connect</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={handleCreate} className="flex flex-col items-center justify-center p-8 rounded-2xl bg-[var(--accent)] text-white transition-transform hover:scale-[1.02] active:scale-[0.98]">
                      <Share2 size={32} className="mb-4 opacity-80" />
                      <p className="font-bold text-base">Create Room</p>
                      <p className="text-[10px] opacity-60 font-bold uppercase tracking-tight mt-1">Share files securely</p>
                    </button>
                    
                    <div className="flex flex-col p-6 rounded-2xl bg-[var(--surface-container)] border border-[var(--outline-var)] items-center justify-center text-center">
                      <LogIn size={32} className="mb-4 opacity-60 text-[var(--on-surface)]" />
                      <p className="font-bold text-base text-[var(--on-surface)] mb-2">Join Room</p>
                      <div className="flex w-full gap-2 mt-2">
                        <input 
                          type="text" 
                          placeholder="00000" 
                          maxLength={5}
                          value={joinCode} 
                          onChange={e => setJoinCode(e.target.value)}
                          className="flex-1 bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-xl px-4 py-2 text-center font-mono font-bold text-lg text-[var(--on-surface)] outline-none focus:border-[var(--accent)]" 
                        />
                        <button 
                          onClick={handleJoin}
                          className="px-4 bg-[var(--accent)] text-white font-bold rounded-xl active:scale-[0.95] transition-transform"
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 bg-[var(--surface-container)] rounded-2xl p-6 border border-[var(--outline-var)] border-dashed">
                    <div className="flex items-center gap-2 mb-4 text-[var(--on-surface-var)]">
                      <HelpCircle size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Quick Guide</span>
                    </div>
                    <ol className="text-sm text-[var(--on-surface-var)] space-y-2 list-decimal list-inside">
                      <li>Create a room on one device.</li>
                      <li>Enter the 5-digit code on the other device.</li>
                      <li>Send files securely peer-to-peer!</li>
                    </ol>
                  </div>
                </div>
              )}

              {view === 'room' && (
                <div className="flex flex-col sm:flex-row gap-6 h-full">
                  {/* Left Column - Room Info */}
                  <div className="w-full sm:w-1/3 flex flex-col gap-4">
                    <div className="bg-[var(--surface-container)] rounded-2xl p-6 border border-[var(--outline-var)]">
                       <div className="flex justify-between items-center mb-6">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center font-bold font-mono text-lg">#</div>
                           <h2 className="text-3xl font-bold font-mono tracking-tighter text-[var(--on-surface)]">{roomId}</h2>
                         </div>
                         <button onClick={handleExit} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--surface-dim)] text-[var(--on-surface-var)] hover:bg-[var(--surface-container-high)]">
                           <LogOut size={20} />
                         </button>
                       </div>
                       
                       <div className="flex items-center gap-2 px-4 py-2 rounded-full w-fit bg-[var(--surface-dim)] border border-[var(--outline-var)]">
                         {status === 'connected' ? (
                           <CheckCircle size={16} className="text-[var(--accent)]" />
                         ) : (
                           <Loader2 size={16} className="text-[var(--on-surface-var)] animate-spin" />
                         )}
                         <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface-var)]">
                           {status === 'connected' ? 'Connected' : 'Connecting...'}
                         </span>
                       </div>
                    </div>

                    <div className="flex-1 bg-[var(--surface-container)] rounded-2xl p-6 border border-[var(--outline-var)] flex flex-col items-center justify-center text-center">
                      <label htmlFor="file-upload" className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${status === 'connected' ? 'bg-[var(--accent)] text-white cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : 'bg-[var(--surface-dim)] text-[var(--on-surface-var)] opacity-50 cursor-not-allowed'}`}>
                        <UploadCloud size={20} />
                        Send Files
                      </label>
                      <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} disabled={status !== 'connected'} />
                      
                      {progress && (
                        <div className="w-full mt-4 text-left">
                          <div className="flex justify-between text-xs mb-1 text-[var(--on-surface-var)]">
                            <span className="truncate max-w-[120px]">{progress.name}</span>
                            <span>{Math.round(progress.percent)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[var(--surface-dim)] rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--accent)] transition-all duration-300" style={{ width: `${progress.percent}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Feed */}
                  <div className="w-full sm:w-2/3 flex flex-col bg-[var(--surface-container)] rounded-2xl border border-[var(--outline-var)] overflow-hidden">
                    <div className="p-4 border-b border-[var(--outline-var)] bg-[var(--surface-dim)]">
                      <h3 className="font-bold text-[var(--on-surface)] text-sm">Received Files</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                      {receivedFiles.length === 0 ? (
                        <div className="m-auto flex flex-col items-center justify-center text-[var(--on-surface-var)] opacity-50">
                          <Share2 size={48} className="mb-2" />
                          <p className="text-xs font-bold uppercase tracking-widest">Encrypted Stream</p>
                        </div>
                      ) : (
                        receivedFiles.map((file, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--outline-var)]">
                            <div className="w-10 h-10 rounded-full bg-[var(--surface-dim)] text-[var(--on-surface)] flex items-center justify-center shrink-0">
                              <Share2 size={16} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-medium truncate text-[var(--on-surface)]">{file.name}</p>
                              <p className="text-[10px] text-[var(--on-surface-var)]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <a href={file.url} download={file.name} className="px-4 py-2 rounded-full text-xs font-bold bg-[var(--accent)] text-white transition-transform hover:scale-95">
                              Download
                            </a>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
