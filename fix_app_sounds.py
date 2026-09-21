import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_str = "import { CLICK_SOUNDS, NOTIFICATION_SOUNDS } from './data/sounds';\n"
if "import { CLICK_SOUNDS" not in content:
    content = content.replace("import React,", import_str + "import React,")

play_audio_old = """    const playAudio = (file: string) => {
      const audio = new Audio(`/sounds/${file}.mp3`);
      audio.volume = soundVolume / 100;
      audio.play().catch(e => console.log('Audio play error:', e));
    };

    if (type === 'click') {
      playAudio(clickSound);
    } else {
      playAudio(notifySound);
    }"""

play_audio_new = """    const playAudio = (fileId: string, type: 'click' | 'alert' | 'toast' | 'reset' | 'victory') => {
      let url = `/sounds/${fileId}.mp3`;
      if (type === 'click') {
         const found = CLICK_SOUNDS.find(s => s.id === fileId);
         if (found) url = found.url;
      } else {
         const found = NOTIFICATION_SOUNDS.find(s => s.id === fileId);
         if (found) url = found.url;
      }
      const audio = new Audio(url);
      audio.volume = soundVolume / 100;
      audio.play().catch(e => console.log('Audio play error:', e));
    };

    if (type === 'click') {
      playAudio(clickSound, type);
    } else {
      playAudio(notifySound, type);
    }"""

content = content.replace(play_audio_old, play_audio_new)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
