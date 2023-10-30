/**
 * Return boolean if client is touchscreen device
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent#mobile_device_detection
 */

import { useEffect, useState } from 'react';

function useIsTouchScreen() {
  const [isTouchScreen, setIsTouchScreen] = useState(false);

  useEffect(() => {
    const { navigator } = window;
    if ('maxTouchPoints' in navigator) {
      setIsTouchScreen(navigator.maxTouchPoints > 0);
    } else if ('msMaxTouchPoints' in navigator) {
      setIsTouchScreen(navigator.msMaxTouchPoints > 0);
    } else {
      const mQ = matchMedia?.('(pointer:coarse)');
      if (mQ?.media === '(pointer:coarse)') {
        setIsTouchScreen(!!mQ.matches);
      } else if ('orientation' in window) {
        setIsTouchScreen(true); // deprecated, but good fallback
      } else {
        // Only as a last resort, fall back to user agent sniffing
        const UA = navigator.userAgent;
        setIsTouchScreen(/\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA)
          || /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA));
      }
    }
  }, []);

  return isTouchScreen;
}

export default useIsTouchScreen;
