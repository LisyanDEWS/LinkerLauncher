import { db } from './firebase';
import { collection, doc, setDoc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
};

export class WebRTCConnection {
  pc: RTCPeerConnection;
  dataChannel: RTCDataChannel | null = null;
  roomId: string | null = null;
  onConnectionStateChange: (state: string) => void = () => {};
  onMessage: (message: any) => void = () => {};
  onDataChannel: (channel: RTCDataChannel) => void = () => {};

  constructor() {
    this.pc = new RTCPeerConnection(servers);
    
    this.pc.onconnectionstatechange = () => {
      this.onConnectionStateChange(this.pc.connectionState);
    };

    this.pc.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannel();
      this.onDataChannel(this.dataChannel);
    };
  }

  private setupDataChannel() {
    if (!this.dataChannel) return;
    this.dataChannel.onmessage = (event) => {
      this.onMessage(event.data);
    };
  }

  async createRoom(): Promise<string> {
    const roomRef = doc(collection(db, 'connectRooms'));
    this.roomId = roomRef.id;

    this.dataChannel = this.pc.createDataChannel('fileTransfer');
    this.setupDataChannel();
    this.onDataChannel(this.dataChannel);

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    const roomWithOffer = {
      offer: {
        type: offer.type,
        sdp: offer.sdp,
      },
      hostCandidates: [],
      guestCandidates: [],
      timestamp: Date.now(),
    };

    await setDoc(roomRef, roomWithOffer);

    // Listen for remote answer and candidates
    onSnapshot(roomRef, (snapshot) => {
      const data = snapshot.data();
      if (!this.pc.currentRemoteDescription && data && data.answer) {
        const answer = new RTCSessionDescription(data.answer);
        this.pc.setRemoteDescription(answer);
      }

      if (data && data.guestCandidates) {
        data.guestCandidates.forEach((candidate: any) => {
          this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        });
      }
    });

    // Collect ICE candidates
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        getDoc(roomRef).then((snap) => {
          const currentCandidates = snap.data()?.hostCandidates || [];
          updateDoc(roomRef, {
            hostCandidates: [...currentCandidates, event.candidate.toJSON()]
          });
        });
      }
    };

    return this.roomId;
  }

  async joinRoom(roomId: string) {
    this.roomId = roomId;
    const roomRef = doc(db, 'connectRooms', roomId);
    const roomSnapshot = await getDoc(roomRef);

    if (!roomSnapshot.exists()) {
      throw new Error('Room not found');
    }

    const offer = roomSnapshot.data().offer;
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    await updateDoc(roomRef, {
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      }
    });

    // Collect ICE candidates
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        getDoc(roomRef).then((snap) => {
          const currentCandidates = snap.data()?.guestCandidates || [];
          updateDoc(roomRef, {
            guestCandidates: [...currentCandidates, event.candidate.toJSON()]
          });
        });
      }
    };

    // Listen for host ICE candidates
    onSnapshot(roomRef, (snapshot) => {
      const data = snapshot.data();
      if (data && data.hostCandidates) {
        data.hostCandidates.forEach((candidate: any) => {
          this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        });
      }
    });
  }

  sendData(data: string | ArrayBuffer | Blob) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(data);
    } else {
      console.error('DataChannel is not open');
    }
  }

  close() {
    this.dataChannel?.close();
    this.pc.close();
  }
}
