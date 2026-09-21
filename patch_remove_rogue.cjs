const fs = require('fs');
let content = fs.readFileSync('src/components/FullSettingsModal.tsx', 'utf-8');

const rogueTarget = `                            </div>
                          </div>
                        </div>
                        )}
                        {/* Theme Color Swatches Section */}`;

const rogueReplacement = `                            </div>
                          </div>
                        </div>
                        {/* Theme Color Swatches Section */}`;

content = content.replace(rogueTarget, rogueReplacement);
fs.writeFileSync('src/components/FullSettingsModal.tsx', content);
