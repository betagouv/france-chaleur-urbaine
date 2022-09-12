const debounce = (handler: (...arg: any) => any, timer: number) => {
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
