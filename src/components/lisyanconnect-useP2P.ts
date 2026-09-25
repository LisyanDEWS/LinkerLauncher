import { useState, useRef, useCallback, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, onSnapshot, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';

export interface TransferProgress {
  percent: number;
  name: string;
  bytesTransferred?: number;
  totalBytes?: number;
}

export interface ReceivedFileItem {
  name: string;
  url: string;
  size: number;
  type?: string;
}

export interface SentFileItem {
  name: string;
  size: number;
}

export function useP2P() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFileItem[]>([]);
  const [sentFiles, setSentFiles] = useState<SentFileItem[]>([]);
  const [progress, setProgress] = useState<TransferProgress | null>(null);
  const [receiveProgress, setReceiveProgress] = useState<TransferProgress | null>(null);

  const pc = useRef<RTCPeerConnection | null>(null);
  const ch = useRef<RTCDataChannel | null>(null);
  const isHost = useRef(false);

  const fileQueue = useRef<File[]>([]);
  const isSending = useRef(false);

  const receivedChunks = useRef<ArrayBuffer[]>([]);
  const receivingMeta = useRef<{ name: string; size: number; type: string; receivedBytes: number } | null>(null);
  const unsubscribe = useRef<(() => void) | null>(null);

  const addedCandidates = useRef<Set<string>>(new Set());

  const initWebRTC = useCallback(() => {
    addedCandidates.current.clear();
    pc.current = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
      ],
    });

    pc.current.onconnectionstatechange = () => {
      if (pc.current?.connectionState === 'disconnected' || pc.current?.connectionState === 'failed') {
        setStatus('idle');
      }
    };

    pc.current.ondatachannel = (ev) => setupChannel(ev.channel);
  }, []);

  const setupChannel = useCallback((channel: RTCDataChannel) => {
    ch.current = channel;
    channel.binaryType = 'arraybuffer';
    channel.bufferedAmountLowThreshold = 65536;

    channel.onopen = () => {
      setStatus('connected');
    };

    channel.onclose = () => {
      setStatus('idle');
      setProgress(null);
      setReceiveProgress(null);
      isSending.current = false;
    };

    channel.onerror = (err) => {
      console.error('Data channel error:', err);
    };

    channel.onmessage = (e) => {
      if (typeof e.data === 'string') {
        const msg = e.data;
        if (msg.startsWith('HEADER:')) {
          try {
            const meta = JSON.parse(msg.substring(7));
            receivingMeta.current = {
              name: meta.name || 'file',
              size: meta.size || 0,
              type: meta.type || 'application/octet-stream',
              receivedBytes: 0,
            };
            receivedChunks.current = [];
            setReceiveProgress({
              percent: 0,
              name: receivingMeta.current.name,
              bytesTransferred: 0,
              totalBytes: receivingMeta.current.size,
            });
          } catch {
            receivingMeta.current = { name: 'file', size: 0, type: 'application/octet-stream', receivedBytes: 0 };
            receivedChunks.current = [];
          }
        } else if (msg.startsWith('NAME:')) {
          const name = msg.substring(5);
          receivingMeta.current = { name, size: 0, type: 'application/octet-stream', receivedBytes: 0 };
          receivedChunks.current = [];
          setReceiveProgress({
            percent: 0,
            name,
            bytesTransferred: 0,
            totalBytes: 0,
          });
        } else if (msg === 'EOF') {
          if (receivingMeta.current) {
            const meta = receivingMeta.current;
            const blob = new Blob(receivedChunks.current, { type: meta.type || 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            setReceivedFiles((prev) => [{ name: meta.name, url, size: blob.size, type: meta.type }, ...prev]);
            setReceiveProgress({
              percent: 100,
              name: meta.name,
              bytesTransferred: blob.size,
              totalBytes: blob.size,
            });

            // Send acknowledgment back to sender so sender knows transfer is 100% finished
            try {
              if (channel.readyState === 'open') {
                channel.send(`ACK:DONE:${meta.name}`);
              }
            } catch {}

            setTimeout(() => {
              setReceiveProgress(null);
            }, 1200);

            receivingMeta.current = null;
            receivedChunks.current = [];
          }
        } else if (msg.startsWith('ACK:DONE:')) {
          // Sender received confirmation from receiver
          setProgress((prev) => (prev ? { ...prev, percent: 100 } : null));
        }
      } else if (e.data instanceof ArrayBuffer) {
        receivedChunks.current.push(e.data);
        if (receivingMeta.current) {
          receivingMeta.current.receivedBytes += e.data.byteLength;
          const total = receivingMeta.current.size;
          const current = receivingMeta.current.receivedBytes;
          const pct = total > 0 ? Math.min(99, Math.round((current / total) * 100)) : 50;
          setReceiveProgress({
            percent: pct,
            name: receivingMeta.current.name,
            bytesTransferred: current,
            totalBytes: total,
          });
        }
      }
    };
  }, []);

  const createRoom = useCallback(async () => {
    initWebRTC();
    setStatus('connecting');
    isHost.current = true;

    if (pc.current) {
      const channel = pc.current.createDataChannel('tx', { ordered: true });
      setupChannel(channel);
    }

    const generateShortId = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    const roomId = generateShortId();
    const roomRef = doc(db, 'connectRooms', roomId);

    if (!pc.current) return roomId;

    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        updateDoc(roomRef, { hostCandidates: arrayUnion(event.candidate.toJSON()) }).catch(() => {});
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
      connected: false,
    };

    await setDoc(roomRef, roomWithOffer);

    let isSettingRemote = false;

    const unsub = onSnapshot(roomRef, async (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      if (!pc.current?.currentRemoteDescription && data.answer && !isSettingRemote) {
        isSettingRemote = true;
        try {
          const answer = new RTCSessionDescription(data.answer);
          await pc.current?.setRemoteDescription(answer);
        } catch (err) {
          console.error('Failed to set remote description on host:', err);
        }
      }

      if (pc.current?.currentRemoteDescription && data.guestCandidates && Array.isArray(data.guestCandidates)) {
        for (const candidate of data.guestCandidates) {
          const candStr = JSON.stringify(candidate);
          if (!addedCandidates.current.has(candStr)) {
            addedCandidates.current.add(candStr);
            pc.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
          }
        }
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

    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        updateDoc(roomRef, { guestCandidates: arrayUnion(event.candidate.toJSON()) }).catch(() => {});
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
      },
    });

    const unsub = onSnapshot(roomRef, (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      if (pc.current?.currentRemoteDescription && data.hostCandidates && Array.isArray(data.hostCandidates)) {
        for (const candidate of data.hostCandidates) {
          const candStr = JSON.stringify(candidate);
          if (!addedCandidates.current.has(candStr)) {
            addedCandidates.current.add(candStr);
            pc.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
          }
        }
      }
    });

    unsubscribe.current = unsub;
  }, [initWebRTC]);

  const processQueue = useCallback(() => {
    if (isSending.current || !fileQueue.current.length || !ch.current || ch.current.readyState !== 'open') return;

    const file = fileQueue.current.shift()!;
    isSending.current = true;

    // Send structured header with metadata so receiver knows the exact name, size and mime type
    const headerPayload = JSON.stringify({
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
    });
    ch.current.send(`HEADER:${headerPayload}`);

    const chunkSize = 16384; // 16KB standard WebRTC chunk
    let offset = 0;

    setProgress({
      percent: 0,
      name: file.name,
      bytesTransferred: 0,
      totalBytes: file.size,
    });

    const sendNextChunk = () => {
      if (!ch.current || ch.current.readyState !== 'open') {
        isSending.current = false;
        setProgress(null);
        return;
      }

      // Check backpressure on RTCDataChannel buffer
      if (ch.current.bufferedAmount > 262144) { // 256KB buffer limit
        ch.current.onbufferedamountlow = () => {
          if (ch.current) ch.current.onbufferedamountlow = null;
          sendNextChunk();
        };
        return;
      }

      if (offset < file.size) {
        const slice = file.slice(offset, offset + chunkSize);
        const reader = new FileReader();

        reader.onload = (e) => {
          if (!e.target?.result || !ch.current || ch.current.readyState !== 'open') {
            isSending.current = false;
            setProgress(null);
            return;
          }

          try {
            ch.current.send(e.target.result as ArrayBuffer);
            offset += (e.target.result as ArrayBuffer).byteLength;

            const pct = Math.min(99, Math.round((offset / file.size) * 100));
            setProgress({
              percent: pct,
              name: file.name,
              bytesTransferred: offset,
              totalBytes: file.size,
            });

            // Continue sending slices immediately
            sendNextChunk();
          } catch (err) {
            console.error('WebRTC send error:', err);
            setTimeout(sendNextChunk, 50);
          }
        };

        reader.readAsArrayBuffer(slice);
      } else {
        // All bytes sent! Send EOF signal
        try {
          ch.current.send('EOF');
        } catch {}

        // Set 100% complete state
        setProgress({
          percent: 100,
          name: file.name,
          bytesTransferred: file.size,
          totalBytes: file.size,
        });

        setSentFiles((prev) => [{ name: file.name, size: file.size }, ...prev]);

        // Keep 100% visible for a moment to give clear feedback, then clear and continue queue
        setTimeout(() => {
          isSending.current = false;
          setProgress(null);
          processQueue();
        }, 1200);
      }
    };

    sendNextChunk();
  }, []);

  const sendFiles = useCallback(
    (files: FileList | File[]) => {
      for (let i = 0; i < files.length; i++) {
        fileQueue.current.push(files[i]);
      }
      processQueue();
    },
    [processQueue],
  );

  const disconnect = useCallback(() => {
    if (unsubscribe.current) {
      unsubscribe.current();
      unsubscribe.current = null;
    }
    if (ch.current) {
      try {
        ch.current.close();
      } catch {}
      ch.current = null;
    }
    if (pc.current) {
      try {
        pc.current.close();
      } catch {}
      pc.current = null;
    }
    addedCandidates.current.clear();
    setStatus('idle');
    setReceivedFiles([]);
    setSentFiles([]);
    setProgress(null);
    setReceiveProgress(null);
    fileQueue.current = [];
    isSending.current = false;
    receivingMeta.current = null;
    receivedChunks.current = [];
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    createRoom,
    joinRoom,
    sendFiles,
    receivedFiles,
    sentFiles,
    progress,
    receiveProgress,
    disconnect,
  };
}
