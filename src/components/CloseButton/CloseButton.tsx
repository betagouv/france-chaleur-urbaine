import styled from 'styled-components';

export const CloseButton = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ffffff;
  box-shadow: 0 1px 2px 1px #33333333;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  cursor: pointer;

  ::before,
  ::after {
    content: '';
    position: absolute;
    width: 2px;
    height: 80%;
    background-color: #333;
  }
  ::before {
    content: '';
    transform: rotate(-45deg);
  }
  ::after {
    content: '';
    transform: rotate(45deg);
  }
`;

export default CloseButton;
