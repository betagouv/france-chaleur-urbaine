const Input = ({ field, ...props }: any) => {
  return (
    <>
      <label htmlFor={props.id}>{props.label}</label>
      <input className={'fr-input'} {...field} {...props} />
    </>
  );
};

export default Input;
