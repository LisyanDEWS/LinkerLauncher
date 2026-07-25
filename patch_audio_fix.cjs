const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const targetAudio1 = `      const audio = new Audio(url);
      audio.volume = soundVolume / 100;
      audio.play().catch(e => console.log('Audio play error:', e));
      if (fileId === 'iphone') {
        setTimeout(() => {
          audio.pause();
          audio.currentTime = 0;
        }, 2000);
      }`;

const replacementAudio1 = `      const audio = new Audio(url);
      audio.volume = soundVolume / 100;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          if (fileId === 'iphone') {
            setTimeout(() => {
              audio.pause();
              audio.currentTime = 0;
            }, 2000);
          }
        }).catch(e => console.log('Audio play error:', e));
      }`;

content = content.replace(targetAudio1, replacementAudio1);

const targetAudio2 = `            const audio = new Audio(url);
            audio.volume = soundVolume / 100;
            audio.play().catch(e => console.log(e));
            if (s === 'iphone') {
              setTimeout(() => {
                audio.pause();
                audio.currentTime = 0;
              }, 2000);
            }`;

const replacementAudio2 = `            const audio = new Audio(url);
            audio.volume = soundVolume / 100;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.then(() => {
                if (s === 'iphone') {
                  setTimeout(() => {
                    audio.pause();
                    audio.currentTime = 0;
                  }, 2000);
                }
              }).catch(e => console.log('Audio play error:', e));
            }`;

content = content.replace(targetAudio2, replacementAudio2);

fs.writeFileSync('src/App.tsx', content);
