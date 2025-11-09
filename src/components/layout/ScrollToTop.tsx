// src/components/layout/ScrollToTop.tsx

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * A component that scrolls the window to the top on every route change.
 * It's a "side-effect" component and renders nothing.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to the top of the page on new page loads
    window.scrollTo(0, 0);
  }, [pathname]); // Re-run this effect whenever the path (URL) changes

  return null; // This component doesn't render any visible HTML
};

export default ScrollToTop;