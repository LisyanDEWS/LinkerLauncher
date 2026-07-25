const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const importTarget = `import FullSettingsModal from './components/FullSettingsModal';`;
const importReplacement = `import FullSettingsModal from './components/FullSettingsModal';
import { LoginScreen } from './components/LoginScreen';`;

content = content.replace(importTarget, importReplacement);

const authStateTarget = `  const [isToastEnabled, setIsToastEnabled] = useState<boolean>(() => {`;
const authStateReplacement = `  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('linkerru_auth') === 'true';
  });
  
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem('linkerru_nickname') || 'Guest';
  });

  const [isToastEnabled, setIsToastEnabled] = useState<boolean>(() => {`;

content = content.replace(authStateTarget, authStateReplacement);

const returnTarget = `  return (
    <div 
      id="main-app-container"`;

const returnReplacement = `  if (!isAuthenticated) {
    return (
      <LoginScreen 
        lang={lang} 
        onLangChange={(l) => {
          setLang(l);
          localStorage.setItem('linkerru_lang', l);
        }} 
        onLogin={(nick) => {
          setNickname(nick);
          localStorage.setItem('linkerru_nickname', nick);
          setIsAuthenticated(true);
          localStorage.setItem('linkerru_auth', 'true');
        }} 
      />
    );
  }

  return (
    <div 
      id="main-app-container"`;

content = content.replace(returnTarget, returnReplacement);

fs.writeFileSync('src/App.tsx', content);
