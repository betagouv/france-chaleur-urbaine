import { useEffect, useRef } from 'react';

function usePreviousState(state: any) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current = state;
  }, [state]);
  return ref.current;
}

export default usePreviousState;
