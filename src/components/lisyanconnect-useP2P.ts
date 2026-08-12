import { useState, useRef, useCallback, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, getDoc, onSnapshot, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';

export function useP2P() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [receivedFiles, setReceivedFiles] = useState<{name: string, url: string, size: number}[]>([]);
  const [sentFiles, setSentFiles] = useState<{name: string, size: number}[]>([]);
  const [progress, setProgress] = useState<{percent: number, name: string} | null>(null);
  
  const pc = useRef<RTCPeerConnection | null>(null);
  const ch = useRef<RTCDataChannel | null>(null);
  const isHost = useRef(false);
  
  const fileQueue = useRef<File[]>([]);
  const isSending = useRef(false);
  
  const receivedChunks = useRef<ArrayBuffer[]>([]);
  const receivingMeta = useRef<{name: string, size: number} | null>(null);
  const unsubscribe = useRef<() => void | null>(null);

  const initWebRTC = useCallback(() => {
    pc.current = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ]
    });
    
    pc.current.ondatachannel = (ev) => setupChannel(ev.channel);
  }, []);

  const setupChannel = useCallback((channel: RTCDataChannel) => {
    ch.current = channel;
    channel.binaryType = 'arraybuffer';
    channel.onopen = () => setStatus('connected');
    channel.onclose = () => setStatus('idle');
    
    channel.onmessage = (e) => {
      if (typeof e.data === 'string') {
        if (e.data.startsWith('NAME:')) {
          receivingMeta.current = { name: e.data.substring(5), size: 0 };
          receivedChunks.current = [];
        } else if (e.data === 'EOF') {
          if (receivingMeta.current) {
            const blob = new Blob(receivedChunks.current);
            const url = URL.createObjectURL(blob);
            setReceivedFiles(prev => [{ name: receivingMeta.current!.name, url, size: blob.size }, ...prev]);
            receivingMeta.current = null;
          }
        }
      } else {
        receivedChunks.current.push(e.data);
      }
    };
  }, []);

  const createRoom = useCallback(async () => {
    initWebRTC();
    setStatus('connecting');
    isHost.current = true;
    
    if (pc.current) {
      ch.current = pc.current.createDataChannel('tx', { ordered: true });
      setupChannel(ch.current);
    }
    
    const generateShortId = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    const roomId = generateShortId();
    const roomRef = doc(db, 'connectRooms', roomId);

    if (!pc.current) return roomId;
    
    // Collect ICE candidates
    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        updateDoc(roomRef, { hostCandidates: arrayUnion(event.candidate.toJSON()) });
      }
    };

    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);

    const roomWithOffer = {
      offer: {
        type: offer.type,
        sdp: offer.sdp,
      },
      hostCandidates: [],
      guestCandidates: [],
      timestamp: serverTimestamp(),
      connected: false
    };

    await setDoc(roomRef, roomWithOffer);

    // Listen for answer and guest candidates
    const guestCandidatesQueue: any[] = [];
    let isSettingRemote = false;

    const unsub = onSnapshot(roomRef, async (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      // Queue candidates
      if (data.guestCandidates) {
        data.guestCandidates.forEach((candidate: any) => {
           // To avoid duplicates, we can just push all and let WebRTC handle it, but better to keep track of added
           guestCandidatesQueue.push(candidate);
        });
      }

      if (!pc.current?.currentRemoteDescription && data.answer && !isSettingRemote) {
        isSettingRemote = true;
        const answer = new RTCSessionDescription(data.answer);
        await pc.current?.setRemoteDescription(answer).catch(console.error);
        
        // Drain queue
        guestCandidatesQueue.forEach(candidate => {
           pc.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        });
      } else if (pc.current?.currentRemoteDescription) {
         // If already set, just drain queue
         guestCandidatesQueue.forEach(candidate => {
           pc.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
         });
      }
      
      // Clear queue after processing
      if (pc.current?.currentRemoteDescription) {
         guestCandidatesQueue.length = 0;
      }
    });
    
    unsubscribe.current = unsub;
    return roomId;
  }, [initWebRTC, setupChannel]);

  const joinRoom = useCallback(async (roomId: string) => {
    initWebRTC();
    setStatus('connecting');
    isHost.current = false;

    const roomRef = doc(db, 'connectRooms', roomId);
    const roomSnapshot = await getDoc(roomRef);

    if (!roomSnapshot.exists()) {
      setStatus('idle');
      throw new Error('Room not found');
    }

    if (!pc.current) return;

    // Collect ICE candidates
    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        updateDoc(roomRef, { guestCandidates: arrayUnion(event.candidate.toJSON()) });
      }
    };

    const offer = roomSnapshot.data().offer;
    await pc.current.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await pc.current.createAnswer();
    await pc.current.setLocalDescription(answer);

    await updateDoc(roomRef, {
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      }
    });

    const hostCandidatesQueue: any[] = [];
    
    // Listen for host ICE candidates
    const unsub = onSnapshot(roomRef, (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      if (data.hostCandidates) {
        data.hostCandidates.forEach((candidate: any) => {
          hostCandidatesQueue.push(candidate);
        });
      }
      
      if (pc.current?.currentRemoteDescription) {
         hostCandidatesQueue.forEach(candidate => {
           pc.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
         });
         hostCandidatesQueue.length = 0;
      }
    });

    unsubscribe.current = unsub;
  }, [initWebRTC]);

  const processQueue = useCallback(() => {
    if (isSending.current || !fileQueue.current.length || !ch.current || ch.current.readyState !== 'open') return;
    
    const file = fileQueue.current.shift()!;
    isSending.current = true;
    ch.current.send(`NAME:${file.name}`);
    
    const reader = new FileReader();
    const chunkSize = 16384; // 16KB
    let offset = 0;
    
    reader.onload = (e) => {
      if (!e.target?.result || !ch.current) return;
      try {
        ch.current.send(e.target.result as ArrayBuffer);
        offset += (e.target.result as ArrayBuffer).byteLength;
      } catch (err) {
        console.error("WebRTC send error:", err);
        setTimeout(readSlice, 100);
        return;
      }
      
      setProgress({ percent: (offset / file.size) * 100, name: file.name });
      
      if (offset < file.size) {
        if (ch.current.bufferedAmount > 2000000) {
          setTimeout(readSlice, 20);
        } else {
          readSlice();
        }
      } else {
        ch.current.send("EOF");
        isSending.current = false;
        setSentFiles(prev => [{ name: file.name, size: file.size }, ...prev]);
        setProgress(null);
        setTimeout(() => processQueue(), 200);
      }
    };
    
    const readSlice = () => reader.readAsArrayBuffer(file.slice(offset, offset + chunkSize));
    readSlice();
  }, []);

  const sendFiles = useCallback((files: FileList | File[]) => {
    for (let i = 0; i < files.length; i++) {
      fileQueue.current.push(files[i]);
    }
    processQueue();
  }, [processQueue]);

  const disconnect = useCallback(() => {
    if (unsubscribe.current) {
      unsubscribe.current();
      unsubscribe.current = null;
    }
    if (ch.current) {
      ch.current.close();
      ch.current = null;
    }
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
    setStatus('idle');
    setReceivedFiles([]);
    setSentFiles([]);
    setProgress(null);
    fileQueue.current = [];
    isSending.current = false;
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { status, createRoom, joinRoom, sendFiles, receivedFiles, sentFiles, progress, disconnect };
}
