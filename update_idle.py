import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

idle_timer_code = """
  // --- Idle Timer (5 minutes) ---
  useEffect(() => {
    let idleTimeout: NodeJS.Timeout;
    
    const resetIdleTimer = () => {
      clearTimeout(idleTimeout);
      // 5 minutes = 300,000 ms
      idleTimeout = setTimeout(() => {
        if (!isStandbyOpen) {
          setIsStandbyOpen(true);
        }
      }, 300000);
    };

    // Initialize
    resetIdleTimer();

    // Event listeners
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => resetIdleTimer();
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      clearTimeout(idleTimeout);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isStandbyOpen]);
"""

# Insert it around line 430
content = re.sub(r'(  // --- Real-time clock update loops ---)', idle_timer_code + r'\n\1', content)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
