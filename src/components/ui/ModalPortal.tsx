import { PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';

/**
 * Create a modal within a portal that is rendered outside the components tree.
 */
export default function ModalPortal({ children }: PropsWithChildren) {
  return createPortal(children, document.body);
}
