type DebouncedFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
};

const debounce = <Handler extends (...args: any[]) => any>(handler: Handler, timer: number): DebouncedFunction<Handler> => {
  let timeOut: NodeJS.Timeout;

  const debouncedFunc = (...arg: Parameters<Handler>) => {
    clearTimeout(timeOut);
    timeOut = setTimeout(() => {
      handler(...arg);
    }, timer);
  };
  debouncedFunc.cancel = () => clearTimeout(timeOut);

  return debouncedFunc;
};

export default debounce;
