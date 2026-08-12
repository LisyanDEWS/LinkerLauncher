const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');
content = content.replace(
  /const \[isContrast, setIsContrast\] = useState<boolean>\(\(\) => \{/,
  `const [isNightLight, setIsNightLight] = useState<boolean>(() => {
    return localStorage.getItem('linkerru_night_light') === 'true';
  });
  const handleNightLightToggle = useCallback(() => {
    setIsNightLight(v => {
      const next = !v;
      localStorage.setItem('linkerru_night_light', String(next));
      if (next) playChime('click');
      return next;
    });
  }, [playChime]);

  const [isContrast, setIsContrast] = useState<boolean>(() => {`
);
fs.writeFileSync('src/App.tsx', content);
console.log('patched');
