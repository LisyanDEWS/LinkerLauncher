const fs = require('fs');
let content = fs.readFileSync('src/components/FullSettingsModal.tsx', 'utf-8');

const target = `                            </div>
                          </div>
                        </div>
                      </div>
                    )}`;

const replacement = `                            </div>
                          </div>
                        </div>
                        )}
                      </div>
                    )}`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/FullSettingsModal.tsx', content);
