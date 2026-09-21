import re

with open('src/components/StandbyClock.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

props_replace = """interface StandbyClockProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  primaryColor: string;
  background: string;
  onOpenSetup: () => void;
  clockType: 'digital' | 'analog';
  clockVariation: 1 | 2 | 3;
}

export default function StandbyClock({ isOpen, onClose, lang, primaryColor, background, onOpenSetup, clockType, clockVariation }: StandbyClockProps) {"""

content = re.sub(r'interface StandbyClockProps \{.*?export default function StandbyClock\(\{ isOpen, onClose, lang, primaryColor, background, onOpenSetup \}: StandbyClockProps\) \{', props_replace, content, flags=re.DOTALL)

clock_display = """          {/* Clock Display Area */}
          <div className="relative z-10 w-full flex items-center justify-center">
            {clockType === 'digital' ? (
              <div 
                className={`text-[18vw] font-black tracking-tighter tabular-nums select-none ${background === 'theme' ? 'text-[var(--on-surface)] drop-shadow-sm' : 'text-white mix-blend-screen drop-shadow-2xl'} ${
                    clockVariation === 1
                      ? ''
                      : clockVariation === 2
                      ? 'font-mono tracking-normal'
                      : 'font-light tracking-widest'
                }`}
                style={{ color: clockVariation === 3 && background === 'theme' ? primaryColor : undefined }}
              >
                {hours}<span className="opacity-50 animate-pulse">:</span>{minutes}
              </div>
            ) : (
              <div
                  className={`relative w-[60vh] h-[60vh] rounded-full border-[1.5vh] flex items-center justify-center transition-all ${
                    clockVariation === 2
                      ? 'border-none shadow-inner bg-black/20'
                      : clockVariation === 3
                      ? 'border-2 bg-transparent'
                      : 'bg-black/10'
                  }`}
                  style={{ 
                    borderColor: clockVariation === 3 && background === 'theme' ? primaryColor : (background === 'theme' ? 'var(--outline)' : 'rgba(255,255,255,0.2)'),
                    backgroundColor: clockVariation === 1 && background === 'theme' ? 'var(--container)' : (clockVariation === 2 && background === 'theme' ? 'var(--surface-dim)' : undefined)
                  }}
                >
                  {clockVariation !== 2 && (
                    <>
                      <div className="absolute top-4 w-3 h-3 rounded-full" style={{ backgroundColor: background === 'theme' ? 'var(--on-surface-var)' : 'rgba(255,255,255,0.5)' }} />
                      <div className="absolute bottom-4 w-3 h-3 rounded-full" style={{ backgroundColor: background === 'theme' ? 'var(--on-surface-var)' : 'rgba(255,255,255,0.5)' }} />
                      <div className="absolute left-4 w-3 h-3 rounded-full" style={{ backgroundColor: background === 'theme' ? 'var(--on-surface-var)' : 'rgba(255,255,255,0.5)' }} />
                      <div className="absolute right-4 w-3 h-3 rounded-full" style={{ backgroundColor: background === 'theme' ? 'var(--on-surface-var)' : 'rgba(255,255,255,0.5)' }} />
                    </>
                  )}
                  {/* Center Dot */}
                  <div
                    className="absolute w-6 h-6 rounded-full z-10"
                    style={{ backgroundColor: background === 'theme' ? primaryColor : '#fff' }}
                  />
                  {/* Hour Hand */}
                  <div
                    className="absolute bottom-1/2 left-1/2 origin-bottom rounded-full"
                    style={{
                      width: '1.5vh',
                      height: '15vh',
                      marginLeft: '-0.75vh',
                      transform: `rotate(${(time.getHours() % 12) * 30 + time.getMinutes() * 0.5}deg)`,
                      backgroundColor: clockVariation === 2 && background === 'theme' ? 'var(--on-surface-var)' : (background === 'theme' ? 'var(--on-surface)' : 'rgba(255,255,255,0.9)'),
                    }}
                  />
                  {/* Minute Hand */}
                  <div
                    className="absolute bottom-1/2 left-1/2 origin-bottom rounded-full"
                    style={{
                      width: '1vh',
                      height: '22vh',
                      marginLeft: '-0.5vh',
                      transform: `rotate(${time.getMinutes() * 6 + time.getSeconds() * 0.1}deg)`,
                      backgroundColor: clockVariation === 2 && background === 'theme' ? 'var(--outline)' : (background === 'theme' ? 'var(--on-surface)' : 'rgba(255,255,255,0.7)'),
                    }}
                  />
                  {/* Second Hand */}
                  <div
                    className="absolute bottom-1/2 left-1/2 origin-bottom rounded-full"
                    style={{
                      width: '0.5vh',
                      height: '25vh',
                      marginLeft: '-0.25vh',
                      transform: `rotate(${time.getSeconds() * 6}deg)`,
                      backgroundColor: clockVariation === 3 && background === 'theme' ? primaryColor : (background === 'theme' ? 'var(--accent-tertiary)' : 'rgba(255,255,255,0.5)'),
                    }}
                  />
              </div>
            )}
          </div>"""

content = re.sub(r'          <div className=\{`relative z-10 text-\[18vw\].*?</div>', clock_display, content, flags=re.DOTALL)

with open('src/components/StandbyClock.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
