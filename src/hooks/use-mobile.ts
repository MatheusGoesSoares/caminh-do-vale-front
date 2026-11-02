import { useState, useEffect } from 'react';

interface ScreenSize {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export function useMobile(): ScreenSize {
  const [screenSize, setScreenSize] = useState<ScreenSize>(() => getScreenSize());

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const tabletQuery = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    const desktopQuery = window.matchMedia('(min-width: 1024px)');

    function update() {
      setScreenSize({
        isMobile: mobileQuery.matches,
        isTablet: tabletQuery.matches,
        isDesktop: desktopQuery.matches,
      });
    }

    mobileQuery.addEventListener('change', update);
    tabletQuery.addEventListener('change', update);
    desktopQuery.addEventListener('change', update);

    return () => {
      mobileQuery.removeEventListener('change', update);
      tabletQuery.removeEventListener('change', update);
      desktopQuery.removeEventListener('change', update);
    };
  }, []);

  return screenSize;
}

function getScreenSize(): ScreenSize {
  if (typeof window === 'undefined') {
    return { isMobile: false, isTablet: false, isDesktop: true };
  }
  const width = window.innerWidth;
  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
  };
}
