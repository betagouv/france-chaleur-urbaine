import { useEffect, useState } from 'react';

// Use this hooks instead of react-hookz/web/useMeasure because the results were wrong
// when used with the Popover component
const useDimensions = (myRef?: React.RefObject<HTMLElement | null>) => {
  const [dimensions, setDimensions] = useState({ height: 0, width: 0 });

  useEffect(() => {
    if (!myRef) {
      return;
    }

    const getDimensions = () => ({
      height: myRef.current?.offsetHeight ?? 0,
      width: myRef.current?.offsetWidth ?? 0,
    });

    const handleResize = () => {
      setDimensions(getDimensions());
    };

    if (myRef.current) {
      setDimensions(getDimensions());
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [myRef]);

  return dimensions;
};

export default useDimensions;
