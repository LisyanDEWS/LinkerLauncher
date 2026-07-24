const fs = require('fs');
let content = fs.readFileSync('src/components/FullSettingsModal.tsx', 'utf-8');

const beforeStandby = `                        {/* Standby Setup */}
                        <div className="bg-[var(--surface-dim)] border border-[var(--outline)] rounded-3xl p-6 relative overflow-hidden group hover:border-[var(--outline-high)] transition-colors">`;

const afterStandby = `                        {/* Standby Setup */}
                        {!isMobileLayout && (
                        <div className="bg-[var(--surface-dim)] border border-[var(--outline)] rounded-3xl p-6 relative overflow-hidden group hover:border-[var(--outline-high)] transition-colors">`;

content = content.replace(beforeStandby, afterStandby);

const beforeStandbyEnd = `                            </div>
                          </div>
                        </div>`;

const afterStandbyEnd = `                            </div>
                          </div>
                        </div>
                        )}`;

content = content.replace(beforeStandbyEnd, afterStandbyEnd);

fs.writeFileSync('src/components/FullSettingsModal.tsx', content);
