import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix playChime
new_playChime = """  // --- Sound Engine (Chimes) ---
  const playChime = (type: 'click' | 'alert' | 'reset' | 'victory' | 'toast' = 'click') => {
    if (!isSoundEnabled || soundVolume === 0) return;
    const now = Date.now();
    if (now - lastChimeRef.current < 50) return; // debounce
    lastChimeRef.current = now;

    const playAudio = (file: string) => {
      const audio = new Audio(`/sounds/${file}.mp3`);
      audio.volume = soundVolume / 100;
      audio.play().catch(e => console.log('Audio play error:', e));
    };

    if (type === 'click') {
      playAudio(clickSound);
    } else {
      playAudio(notifySound);
    }
  };"""

content = re.sub(
    r"  // --- Sound Engine \(Chimes\) ---.*?  // --- Custom Toast Trigger ---",
    new_playChime + "\n\n  // --- Custom Toast Trigger ---",
    content,
    flags=re.DOTALL
)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

