import { type ReactNode, useCallback, useState } from 'react';

import Icon from '@/components/ui/Icon';
import cx from '@/utils/cx';

export const copyToClipboard = (text: string): Promise<boolean> => {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return Promise.resolve(false);
  }
  return navigator.clipboard.writeText(text).then(() => true);
};

export const useCopy = (timeout = 2000) => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    (text: string) => {
      return copyToClipboard(text).then((success) => {
        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), timeout);
        }
        return success;
      });
    },
    [timeout]
  );

  return { copied, copy };
};

export type ButtonCopyProps = {
  text: string;
  className?: string;
  title?: string;
  onSuccess?: () => void;
  onClick?: () => void;
  children?: ReactNode;
  showOverlay?: boolean;
};

const ButtonCopy: React.FC<ButtonCopyProps> = ({ text, className, title = 'Copier', onSuccess, onClick, children, showOverlay }) => {
  const { copied, copy } = useCopy();

  const handleCopy = useCallback(() => {
    onClick?.();
    void copy(text).then((success) => {
      if (success) {
        onSuccess?.();
      }
    });
  }, [text, onSuccess, onClick, copy]);

  if (children) {
    return (
      <span className={cx('relative block', className)} onClick={handleCopy}>
        {showOverlay && copied && (
          <span className="inset-0 flex items-center justify-center bg-white/50 absolute">
            <span className="py-1 px-2 rounded-md text-sm text-white bg-blue">Copié</span>
          </span>
        )}
        {children}
      </span>
    );
  }

  return (
    <button type="button" onClick={handleCopy} className={cx('cursor-pointer', className)} title={title}>
      <Icon name={copied ? 'ri-check-line' : 'ri-file-copy-line'} color={copied ? 'green' : undefined} />
    </button>
  );
};

export default ButtonCopy;
