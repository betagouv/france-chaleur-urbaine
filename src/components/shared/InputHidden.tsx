import styled from 'styled-components';

const Div = styled.div`
  position: absolute;
  top: -9999px;
  left: -9999px;
`;
const InputHidden = ({ field, ...props }: any) => {
  return (
    <Div>
      <input type={'checkbox'} id={field.name} {...field} {...props} />
      <label htmlFor={field.name}>{field.name}</label>
    </Div>
  );
};

export default InputHidden;
