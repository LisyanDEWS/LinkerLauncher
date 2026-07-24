import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: playChime iphone duration limit
playaudio_pattern = r'''      const audio = new Audio\(url\);\n      audio\.volume = soundVolume / 100;\n      audio\.play\(\)\.catch\(e => console\.log\('Audio play error:', e\)\);\n    \};'''
playaudio_repl = r'''      const audio = new Audio(url);
      audio.volume = soundVolume / 100;
      audio.play().catch(e => console.log('Audio play error:', e));
      if (fileId === 'iphone') {
        setTimeout(() => {
          audio.pause();
          audio.currentTime = 0;
        }, 2000);
      }
    };'''
content = re.sub(playaudio_pattern, playaudio_repl, content)


# Fix 2: onClickSoundChange preview
click_sound_old = r'''        onClickSoundChange={\(s\) => \{
          setClickSound\(s\);
          localStorage\.setItem\('linkerru_click_sound', s\);
        \}}'''

click_sound_new = r'''        onClickSoundChange={(s) => {
          setClickSound(s);
          localStorage.setItem('linkerru_click_sound', s);
          const url = CLICK_SOUNDS.find(x => x.id === s)?.url;
          if (url && isSoundEnabled && soundVolume > 0) {
            const audio = new Audio(url);
            audio.volume = soundVolume / 100;
            audio.play().catch(e => console.log(e));
          }
        }}'''
content = re.sub(click_sound_old, click_sound_new, content)

# Fix 3: onNotifySoundChange preview
notify_sound_old = r'''        onNotifySoundChange={\(s\) => \{
          setNotifySound\(s\);
          localStorage\.setItem\('linkerru_notify_sound', s\);
        \}}'''

notify_sound_new = r'''        onNotifySoundChange={(s) => {
          setNotifySound(s);
          localStorage.setItem('linkerru_notify_sound', s);
          const url = NOTIFICATION_SOUNDS.find(x => x.id === s)?.url;
          if (url && isSoundEnabled && soundVolume > 0) {
            const audio = new Audio(url);
            audio.volume = soundVolume / 100;
            audio.play().catch(e => console.log(e));
            if (s === 'iphone') {
              setTimeout(() => {
                audio.pause();
                audio.currentTime = 0;
              }, 2000);
            }
          }
        }}'''
content = re.sub(notify_sound_old, notify_sound_new, content)

# Fix 4: Quick Toggles rename
toggles_old = r'''\{lang === 'ru' \? 'Быстрые переключатели' : 'Quick Toggles'\}'''
toggles_new = r'''{lang === 'ru' ? 'Быстрые настройки' : 'Quick Toggles'}'''
content = re.sub(toggles_old, toggles_new, content)
# Wait, user said "rename remove /переключатели/ quick toggles and icon rename to just quick toggles".
# It might be in the code as "Быстрые настройки" or similar. Let's find "переключатели" in the file if it exists.
# I'll just do a straight replace of "переключатели" -> "Quick Toggles" or similar if they meant the UI text. Let me do a find/replace.

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
