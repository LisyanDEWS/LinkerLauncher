import { useState, useRef, useCallback } from 'react';

// Custom React Hook for Lisyan Connect P2P functionality
export function useP2P() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [receivedFiles, setReceivedFiles] = useState<{name: string, url: string, size: number}[]>([]);
  const [progress, setProgress] = useState<{percent: number, name: string} | null>(null);

  const pc = useRef<RTCPeerConnection | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const ch = useRef<RTCDataChannel | null>(null);
  const isHost = useRef(false);

  const fileQueue = useRef<File[]>([]);
  const isSending = useRef(false);
  const receivedChunks = useRef<ArrayBuffer[]>([]);
  const receivingMeta = useRef<{name: string, size: number} | null>(null);

  const initWebRTC = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws.current = new WebSocket(`${protocol}//${window.location.host}`);
    pc.current = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    ws.current.onmessage = async (e) => {
      const data = JSON.parse(e.data);
      if (!pc.current) return;

      if (data.type === 'offer') {
        pc.current.ondatachannel = (ev) => setupChannel(ev.channel);
        await pc.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const ans = await pc.current.createAnswer();
        await pc.current.setLocalDescription(ans);
        ws.current?.send(JSON.stringify({ type: 'answer', answer: ans }));
      } else if (data.type === 'answer') {
        if (!pc.current.currentRemoteDescription) {
          await pc.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      } else if (data.type === 'candidate') {
        await pc.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      } else if (data.type === 'peer_joined' && isHost.current) {
        const off = await pc.current.createOffer();
        await pc.current.setLocalDescription(off);
        ws.current?.send(JSON.stringify({ type: 'offer', offer: off }));
      }
    };

    pc.current.onicecandidate = (e) => {
      if (e.candidate && ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'candidate', candidate: e.candidate }));
      }
    };
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

    const roomId = Math.floor(10000 + Math.random() * 90000).toString();
    const joinMsg = JSON.stringify({ type: 'join', roomId, isHost: true });
    
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(joinMsg);
    } else if (ws.current) {
      ws.current.onopen = () => ws.current?.send(joinMsg);
    }
    
    return roomId;
  }, [initWebRTC, setupChannel]);

  const joinRoom = useCallback(async (roomId: string) => {
    initWebRTC();
    setStatus('connecting');
    isHost.current = false;

    const joinMsg = JSON.stringify({ type: 'join', roomId });
    const peerMsg = JSON.stringify({ type: 'peer_joined' });

    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(joinMsg);
      ws.current.send(peerMsg);
    } else if (ws.current) {
      ws.current.onopen = () => {
        ws.current?.send(joinMsg);
        ws.current?.send(peerMsg);
      };
    }
  }, [initWebRTC]);

  const processQueue = useCallback(() => {
    if (isSending.current || !fileQueue.current.length || !ch.current || ch.current.readyState !== 'open') return;
    
    const file = fileQueue.current.shift()!;
    isSending.current = true;
    ch.current.send(`NAME:${file.name}`);
    
    const reader = new FileReader();
    const chunkSize = 16384;
    let offset = 0;
    
    reader.onload = (e) => {
      if (!e.target?.result || !ch.current) return;
      ch.current.send(e.target.result as ArrayBuffer);
      offset += (e.target.result as ArrayBuffer).byteLength;
      
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

  return { status, createRoom, joinRoom, sendFiles, receivedFiles, progress };
}
