const fs = require('fs');
let content = fs.readFileSync('src/components/lisyanconnect-useP2P.ts', 'utf-8');

const createRoomTarget = `    let remoteSet = false;
    const unsub = onSnapshot(roomRef, async (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      if (!pc.current?.currentRemoteDescription && data.answer) {
        const answer = new RTCSessionDescription(data.answer);
        await pc.current?.setRemoteDescription(answer).catch(console.error);
        remoteSet = true;
      }

      if (data.guestCandidates && (remoteSet || pc.current?.currentRemoteDescription)) {
        data.guestCandidates.forEach((candidate: any) => {
          pc.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        });
      }
    });`;

const createRoomReplacement = `    const unsub = onSnapshot(roomRef, async (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      if (!pc.current?.currentRemoteDescription && data.answer) {
        const answer = new RTCSessionDescription(data.answer);
        await pc.current?.setRemoteDescription(answer).catch(console.error);
      }

      if (data.guestCandidates && pc.current?.remoteDescription) {
        data.guestCandidates.forEach((candidate: any) => {
          pc.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        });
      }
    });`;

content = content.replace(createRoomTarget, createRoomReplacement);

const joinRoomTarget = `    // Listen for host ICE candidates
    const unsub = onSnapshot(roomRef, (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      if (data.hostCandidates && pc.current?.currentRemoteDescription) {
        data.hostCandidates.forEach((candidate: any) => {
          pc.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        });
      }
    });`;

const joinRoomReplacement = `    // Listen for host ICE candidates
    const unsub = onSnapshot(roomRef, (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      if (data.hostCandidates && pc.current?.remoteDescription) {
        data.hostCandidates.forEach((candidate: any) => {
          pc.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        });
      }
    });`;
    
content = content.replace(joinRoomTarget, joinRoomReplacement);

fs.writeFileSync('src/components/lisyanconnect-useP2P.ts', content);
