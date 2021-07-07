const Textarea = ({ field, ...props }: any) => {
  return (
    <>
      <label htmlFor={props.id}>{props.label}</label>
      <textarea className="fr-input" {...field} {...props} />
    </>
  );
};

export default Textarea;
