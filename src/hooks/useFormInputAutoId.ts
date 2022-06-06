import { useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

type FormInputAutoIdType = { id: string; name: string };

const useFormInputAutoId = ({ id, name }: FormInputAutoIdType) => {
  const refId = useRef(uuidv4());
  const autoId = useMemo(
    () => `${id || name || 'id'}-${refId.current}`,
    [name, id]
  );

  return autoId;
};

export default useFormInputAutoId;
