const Checkbox = ({ field, ...props }: any) => {
  return (
    <>
      <input type={props.type} {...field} {...props} />
      <label className="fr-label" htmlFor={props.id}>
        {props.label}
      </label>
    </>
  );
};
export default Checkbox;
