function Select({ field, ...props }: any) {
  return (
    <>
      <label className="fr-label" htmlFor={props.id}>
        {props.label}
      </label>
      <select className="fr-select" {...field} {...props}>
        <option defaultValue="" disabled hidden>
          Selectionnez une option
        </option>
        <option value="Option 1">Option 1</option>
        <option value="Option 2">Option 2</option>
        <option value="Option 3">Option 3</option>
        <option value="Option 4">Option 4</option>
      </select>
    </>
  );
}

export default Select;
