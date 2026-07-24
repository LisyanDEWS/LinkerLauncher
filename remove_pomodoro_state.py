import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'  const \[pomodoroTime, setPomodoroTime\] = useState.*?\}\n', '', content, flags=re.DOTALL)
content = re.sub(r'  // --- Pomodoro Logic ---.*?  \}\n\n', '', content, flags=re.DOTALL)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
