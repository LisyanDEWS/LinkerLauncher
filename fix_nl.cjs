const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Remove the one at the top
const nlStart = content.indexOf('  const handleNightLightToggle = useCallback(() => {');
const nlEnd = content.indexOf('  }, [playChime]);') + '  }, [playChime]);'.length;
content = content.substring(0, nlStart) + content.substring(nlEnd);

// Add it near handleContrastToggle
const contrastRegex = /const handleContrastToggle = \(\) => \{[\s\S]*?\};/;
const handleNightLightToggleCode = `
  const handleNightLightToggle = () => {
    playChime('click');
    const next = !isNightLight;
    setIsNightLight(next);
    localStorage.setItem('linkerru_night_light', String(next));
  };`;

content = content.replace(contrastRegex, match => match + '\\n' + handleNightLightToggleCode);

fs.writeFileSync('src/App.tsx', content);
console.log('fixed nl toggle');
