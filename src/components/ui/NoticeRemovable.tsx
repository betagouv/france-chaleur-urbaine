import React from 'react';

import { useLocalStorage } from '@hooks';

import Notice, { type NoticeProps } from './Notice';

export type NoticeRemovableProps = NoticeProps & {
  keyName: string;
  onClick?: () => void;
};

const NoticeRemovable: React.FC<NoticeRemovableProps> = ({ className, onClose, onClick, keyName, ...props }) => {
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const { value: hidden, set: setHidden } = useLocalStorage<boolean>(`hide-${keyName}-banner`, {
    defaultValue: false,
    initializeWithValue: true,
  });
  // HACK: because DSFR onClose does not fire event
  const isClosingRef = React.useRef(false);

  // Avoid displaying in SSR and on first load
  React.useEffect(() => {
    setHasLoaded(true);
  }, []);

  // Do not render if SSR or on first load
  if (!hasLoaded || hidden) {
    return null;
  }

  return (
    <Notice
      className={className}
      isClosed={!!hidden}
      onClose={() => {
        isClosingRef.current = true;
        setHidden(true);
        onClose?.();
      }}
      onClick={(e) => {
        if (isClosingRef.current) {
          isClosingRef.current = false;
          return;
        }
        setHidden(true);
        onClick?.();
        e.stopPropagation();
      }}
      {...props}
    />
  );
};

export default NoticeRemovable;
