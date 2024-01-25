const debounce = (
  handler: (...arg: any) => void,
  timer: number
): { (...arg: any): void; cancel: () => void } => {
  let timeOut: NodeJS.Timeout;

  const debouncedFunc = (...arg: any) => {
    clearTimeout(timeOut);
    timeOut = setTimeout(() => {
      handler(...arg);
    }, timer);
  };
  debouncedFunc.cancel = () => clearTimeout(timeOut);

  return debouncedFunc;
};

export default debounce;
