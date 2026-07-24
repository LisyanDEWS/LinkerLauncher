const fs = require('fs');
let content = fs.readFileSync('src/components/FullSettingsModal.tsx', 'utf-8');

const beforeStandby = `                        {/* Standby Mode Background Section */}
                        <div className="space-y-3 mt-4" id="standby-bg-settings">`;

const afterStandby = `                        {/* Standby Mode Background Section */}
                        {!isMobileLayout && (
                        <div className="space-y-3 mt-4" id="standby-bg-settings">`;

const beforeStandbyEnd = `                        </div>`;

content = content.replace(beforeStandby, afterStandby);
fs.writeFileSync('src/components/FullSettingsModal.tsx', content);
