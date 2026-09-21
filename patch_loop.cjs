const fs = require('fs');
let content = fs.readFileSync('src/components/LisyanConnectModal.tsx', 'utf-8');

const beforeLoop = `  useEffect(() => {
    if (progress) {
      if (!isTransferring) {
        setIsTransferring(true);
        transferStartTime.current = Date.now();
      }
      setArtificialProgress(progress);
    } else if (isTransferring) {
      const elapsed = Date.now() - transferStartTime.current;
      if (elapsed < 3000) {
        const remaining = 3000 - elapsed;
        let p = 100;
        if (artificialProgress) {
            p = Math.max(artificialProgress.percent, 99);
        }
        setArtificialProgress({ percent: p, name: artificialProgress?.name || 'File' });
        
        transferTimer.current = setTimeout(() => {
          setIsTransferring(false);
          setArtificialProgress(null);
        }, remaining);
      } else {
        setIsTransferring(false);
        setArtificialProgress(null);
      }
    }
    return () => {
      if (transferTimer.current) clearTimeout(transferTimer.current);
    };
  }, [progress, isTransferring, artificialProgress]);`;

const afterLoop = `  useEffect(() => {
    if (progress) {
      if (!isTransferring) {
        setIsTransferring(true);
        transferStartTime.current = Date.now();
      }
      setArtificialProgress(progress);
    } else if (isTransferring) {
      const elapsed = Date.now() - transferStartTime.current;
      if (elapsed < 3000) {
        const remaining = 3000 - elapsed;
        
        setArtificialProgress(prev => {
          const p = Math.max(prev?.percent || 0, 99);
          return { percent: 100, name: prev?.name || 'File' };
        });
        
        transferTimer.current = setTimeout(() => {
          setIsTransferring(false);
          setArtificialProgress(null);
        }, remaining);
      } else {
        setIsTransferring(false);
        setArtificialProgress(null);
      }
    }
    return () => {
      if (transferTimer.current) clearTimeout(transferTimer.current);
    };
  }, [progress, isTransferring]);`;

content = content.replace(beforeLoop, afterLoop);
fs.writeFileSync('src/components/LisyanConnectModal.tsx', content);
