import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace manually
content = content.replace(
'''      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => {
          playChime('click');
          setIsCalendarOpen(false);
        }}
        lang={lang}
        activePalette={activePalette}
      />''',
'''      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => {
          playChime('click');
          setIsCalendarOpen(false);
        }}
        lang={lang}
        primaryColor={activePalette.primary}
      />'''
)

content = content.replace(
'''      <WeatherModal
        isOpen={isWeatherOpen}
        onClose={() => {
          playChime('click');
          setIsWeatherOpen(false);
        }}
        lang={lang}
        activePalette={activePalette}
        onOpenInLinkerRu={() => {
          playChime('click');
          triggerToast(t.ph_soon);
        }}
      />''',
'''      <WeatherModal
        isOpen={isWeatherOpen}
        onClose={() => {
          playChime('click');
          setIsWeatherOpen(false);
        }}
        lang={lang}
        primaryColor={activePalette.primary}
        onOpenInLinkerRu={() => {
          playChime('click');
          triggerToast(t.ph_soon);
        }}
      />'''
)

content = content.replace(
'''      <SettingsModal
        isOpen={isQuickSettingsOpen}
        onClose={() => {
          playChime('click');
          setIsQuickSettingsOpen(false);
        }}
        lang={lang}
        onLangChange={handleLangChange}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onOpenFullSettings={() => setIsFullSettingsOpen(true)}
        activePalette={activePalette}
        brightness={brightness}
        onBrightnessChange={(v) => {
          setBrightness(v);
          localStorage.setItem('linkerru_brightness', v.toString());
        }}
        volume={soundVolume}
        onVolumeChange={(v) => {
          setSoundVolume(v);
          localStorage.setItem('linkerru_sound_volume', v.toString());
        }}
      />''',
'''      <SettingsModal
        isOpen={isQuickSettingsOpen}
        onClose={() => {
          playChime('click');
          setIsQuickSettingsOpen(false);
        }}
        lang={lang}
        onLangChange={handleLangChange}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onOpenFullSettings={() => setIsFullSettingsOpen(true)}
        primaryColor={activePalette.primary}
        brightness={brightness}
        onBrightnessChange={(v) => {
          setBrightness(v);
          localStorage.setItem('linkerru_brightness', v.toString());
        }}
        volume={soundVolume}
        onVolumeChange={(v) => {
          setSoundVolume(v);
          localStorage.setItem('linkerru_sound_volume', v.toString());
        }}
      />'''
)

content = content.replace(
'''      <ServerModal
        isOpen={isServerOpen}
        onClose={() => {
          playChime('click');
          setIsServerOpen(false);
        }}
        lang={lang}
        selectedServer={selectedServer}
        onSelectServer={handleServerChange}
        activePalette={activePalette}
      />''',
'''      <ServerModal
        isOpen={isServerOpen}
        onClose={() => {
          playChime('click');
          setIsServerOpen(false);
        }}
        lang={lang}
        selectedServer={selectedServer}
        onSelectServer={handleServerChange}
        primaryColor={activePalette.primary}
      />'''
)

# Fix soundProfile props being passed to FullSettingsModal
content = re.sub(r'\n\s*onSoundProfileChange=\{.*?\}\}', '', content, flags=re.DOTALL)
content = re.sub(r'\n\s*soundProfile=\{soundProfile\}', '', content)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
