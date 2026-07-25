const fs = require('fs');
let content = fs.readFileSync('src/components/lisyanconnect-useP2P.ts', 'utf-8');

const createRoomTarget = `    const unsub = onSnapshot(roomRef, async (snapshot) => {
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

const createRoomReplacement = `    const guestCandidatesQueue: any[] = [];
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
    });`;

content = content.replace(createRoomTarget, createRoomReplacement);

const joinRoomTarget = `    // Listen for host ICE candidates
    const unsub = onSnapshot(roomRef, (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      if (data.hostCandidates && pc.current?.remoteDescription) {
        data.hostCandidates.forEach((candidate: any) => {
          pc.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        });
      }
    });`;

const joinRoomReplacement = `    const hostCandidatesQueue: any[] = [];
    
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
    });`;
    
content = content.replace(joinRoomTarget, joinRoomReplacement);

fs.writeFileSync('src/components/lisyanconnect-useP2P.ts', content);
