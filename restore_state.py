import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

restore_str = """  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(1500);
  const pomodoroIntervalRef = useRef<any>(null);

  const [gameVictory, setGameVictory] = useState(false);
  const [gameCards, setGameCards] = useState<{id: number, emoji: string, matched: boolean, flipped: boolean}[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  
  const baseEmojis = ['🌞', '🪐', '🚀', '🛸', '⭐', '☄️'];

  const t = translations[lang];

  const activePalette = useMemo(() => {
    return materialPalettes.find((p) => p.id === activePaletteId) || materialPalettes[0];
  }, [activePaletteId]);

"""

# Insert before type ToastMessage
content = content.replace('  type ToastMessage = { id: string, text: string };', restore_str + '  type ToastMessage = { id: string, text: string };')

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
