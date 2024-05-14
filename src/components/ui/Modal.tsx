import { PropsWithChildren, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Create a modal within a portal that is rendered under modal-root, outside the components tree.
 */
export default function Modal({ children }: PropsWithChildren) {
  const modalRoot = document.getElementById('modal-root'); // set in _document.tsx
  const wrapper: React.RefObject<HTMLElement> = useRef(modalRoot);
  useEffect(() => {
    const current = wrapper.current as HTMLElement;
    document.body.appendChild(current);

    return () => {
      document.body.removeChild(current);
    };
  }, []);

  if (!wrapper.current) {
    return <></>;
  }
  return createPortal(children, wrapper.current);
}
