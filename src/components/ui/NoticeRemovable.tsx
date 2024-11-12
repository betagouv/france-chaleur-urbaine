import React from 'react';

import { useLocalStorage } from '@hooks';

import Notice, { type NoticeProps } from './Notice';

export type NoticeRemovableProps = NoticeProps & {
  keyName: string;
};

const NoticeRemovable: React.FC<NoticeRemovableProps> = ({ className, onClose, keyName, ...props }) => {
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const { value: hidden, set: setHidden } = useLocalStorage<boolean>(`hide-${keyName}-banner`, {
    defaultValue: false,
    initializeWithValue: true,
  });

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
        setHidden(true);
        onClose?.();
      }}
      {...props}
    />
  );
};

export default NoticeRemovable;
