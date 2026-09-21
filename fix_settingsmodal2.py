with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """        onClickSoundChange={(s) => {
          setClickSound(s);
          localStorage.setItem('linkerru_click_sound', s);
        }}
        onNotifySoundChange={(s) => {
          setNotifySound(s);
          localStorage.setItem('linkerru_notify_sound', s);
        }}
"""

# SettingsModal occurs before FullSettingsModal. Let's find SettingsModal and remove target inside it.
sm_idx = content.find('<SettingsModal')
fsm_idx = content.find('<FullSettingsModal')

if target in content[sm_idx:fsm_idx]:
    content = content[:sm_idx] + content[sm_idx:fsm_idx].replace(target, '') + content[fsm_idx:]
    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
else:
    print("Not found in SettingsModal")
