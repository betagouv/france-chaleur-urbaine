import { useIntersectionObserver, type UseIntersectionObserverOptions } from '@react-hookz/web';
import { useRef } from 'react';

const useInViewport = <T extends HTMLElement>(options?: UseIntersectionObserverOptions) => {
  const ref = useRef<T | null>(null); // Use the generic type T
  const entry = useIntersectionObserver(ref.current, options); // Ensure ref.current is passed to useIntersectionObserver
  const isInView = !!entry?.isIntersecting;

  return [ref, isInView] as const;
};

export default useInViewport;
