const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const beforeSettingsProps = `        onPanicUrlChange={(url) => {
          setPanicUrl(url);
          localStorage.setItem('linkerru_panic_url', url);
        }}
        standbyBg={standbyBg}`;

const afterSettingsProps = `        onPanicUrlChange={(url) => {
          setPanicUrl(url);
          localStorage.setItem('linkerru_panic_url', url);
        }}
        isMobileLayout={isMobileLayout}
        standbyBg={standbyBg}`;

content = content.replace(beforeSettingsProps, afterSettingsProps);
fs.writeFileSync('src/App.tsx', content);
