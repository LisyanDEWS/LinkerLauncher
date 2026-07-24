import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

fix = """  // --- Sound Engine (Chimes) ---
  const playChime = (type: 'click' | 'alert' | 'reset' = 'click') => {
    if (!isSoundEnabled || soundVolume === 0) return;
    const now = Date.now();
    if (now - lastChimeRef.current < 50) return; // debounce
    lastChimeRef.current = now;

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      const volFactor = soundVolume / 100;"""

content = re.sub(r'  // --- Pomodoro State ---\s+try \{.*?const ctx = new \(window\.AudioContext \|\| \(window as any\)\.webkitAudioContext\)\(\);\s+const osc = ctx\.createOscillator\(\);\s+const gain = ctx\.createGain\(\);\s+const volFactor = soundVolume / 100;', fix, content, flags=re.DOTALL)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
