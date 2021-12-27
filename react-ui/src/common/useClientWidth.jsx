import { useEffect, useState } from 'react';

const getCurrentWidth = () => document.getElementsByTagName('html')[0].clientWidth;

function useClientWidth() {
  const [clientWidth, setClientWidth] = useState(getCurrentWidth());

  useEffect(() => {
    function handleResize() {
      setClientWidth(getCurrentWidth());
    }

    window.addEventListener('resize', handleResize);

    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return clientWidth;
}

export default useClientWidth;
