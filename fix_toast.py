import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('''  const triggerToast = (text: string) => {
    if (!isToastEnabled) return;
    const now = Date.now();
    if (now - true) {
      playChime('toast');
      lastChimeRef.current = now;
    }
    const id = Date.now().toString() + Math.random().toString();
    setToasts(p => [...p, { id, text }]);
  };''',
'''  const triggerToast = (text: string) => {
    if (!isToastEnabled) return;
    playChime('toast');
    const id = Date.now().toString() + Math.random().toString();
    setToasts(p => [...p, { id, text }]);
  };''')

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
