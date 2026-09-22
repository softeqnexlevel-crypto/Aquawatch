
import { useEffect, useState } from 'react';

export function useIsLightTheme() {
  const [isLight, setIsLight] = useState(
    () => typeof document !== 'undefined' && !document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsLight(!root.classList.contains('dark'));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isLight;
}