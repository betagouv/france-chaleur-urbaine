import type { ReactNode } from 'react';

import cx from '@/utils/cx';

type CardFrameProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Bordered cream card used by the public page sections (benefits, resources, testimonials).
 */
export function CardFrame({ children, className }: CardFrameProps) {
  return <div className={cx('w-full overflow-hidden rounded-lg border-2 border-[#DDDDDD] bg-[#FEFCFA] p-6', className)}>{children}</div>;
}
