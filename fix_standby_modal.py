import re

with open('src/components/StandbySetupModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the grid rendering in StandbySetupModal
old_grid = """            <div className="grid grid-cols-2 gap-3 mb-8">
              {gradients.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setBackground(g.id)}
                  className={`relative h-20 rounded-2xl border-2 overflow-hidden transition-all hover:scale-105 active:scale-95 ${
                    background === g.id ? 'border-white shadow-lg' : 'border-transparent'
                  }`}
                  style={{ background: g.style }}
                >
                  {background === g.id && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center">
                        <Check size={14} strokeWidth={4} />
                      </div>
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white drop-shadow-md">
                    {g.name}
                  </span>
                </button>
              ))}
            </div>"""

new_grid = """            <div className="grid grid-cols-5 gap-2 mb-8">
              {gradients.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setBackground(g.id)}
                  className={`relative h-12 rounded-xl border-2 overflow-hidden transition-all ${
                    background === g.id ? 'border-[var(--on-surface)] scale-95 shadow-md' : 'border-[var(--outline-var)] hover:border-[var(--outline)]'
                  }`}
                  style={{ background: g.style }}
                  title={g.name}
                >
                  {background === g.id && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Check size={14} strokeWidth={4} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>"""

content = content.replace(old_grid, new_grid)

# Change gradients array to remove names, just use "Style 1" etc or just remove completely.
content = content.replace("name: 'Aurora'", "name: 'Gradient 1'")
content = content.replace("name: 'Ocean'", "name: 'Gradient 2'")
content = content.replace("name: 'Sunset'", "name: 'Gradient 3'")
content = content.replace("name: 'Midnight'", "name: 'Gradient 4'")

with open('src/components/StandbySetupModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

