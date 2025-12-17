import { type ReactNode, useCallback, useState } from 'react';

import Icon from '@/components/ui/Icon';
import { notify } from '@/modules/notification';
import cx from '@/utils/cx';

export const copyToClipboard = (text: string): void => {
  void navigator.clipboard.writeText(text).catch(() => notify('error', 'Erreur lors de la copie'));
};

export const useCopy = (timeout = 2000) => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    (text: string) => {
      void navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), timeout);
        })
        .catch(() => {
          notify('error', 'Erreur lors de la copie');
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

/**
 * Bouton permettant de copier du texte dans le presse-papiers.
 * Peut être utilisé de deux manières :
 * - Sans children : affiche une icône de copie cliquable
 * - Avec children : affiche le contenu fourni et le rend cliquable (avec overlay optionnel)
 */
function ButtonCopy({ text, className, title = 'Copier', onSuccess, onClick, children, showOverlay }: ButtonCopyProps) {
  const { copied, copy } = useCopy();

  const handleCopy = useCallback(() => {
    onClick?.();
    copy(text);
    onSuccess?.();
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
}

export default ButtonCopy;
