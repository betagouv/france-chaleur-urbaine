import styled, { css } from 'styled-components';

const inputStyle = css`
  background-color: #fff;
  border: 1px solid #fff;
  padding: 0.6em 1em;
  border-radius: 2em;
  font-size: 1rem;
  width: 16em;
  height: 2.75em;
`;

export const Input = styled.input`
  ${inputStyle}
`;

const SelectWrapper = styled.div.attrs({ className: 'select-wrapper' })`
  ${inputStyle}
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  width: calc(16em + 2em);
  padding: 0em 0.5em;
  overflow: hidden;

  select {
    text-align: right;
    font-size: 1em;
    height: 100%;
    border: 0 none transparent;
    background-color: transparent;
    color: #4550e5;

    outline: none;

    option {
    }
  }
`;
export const Select = (props: any) => (
  <SelectWrapper>
    <select title={props.title} {...props} />
  </SelectWrapper>
);

const breakPoint = '1050px';

export const Container = styled.div`
  display: flex;
  flex-direction: column;

  @media (min-width: ${breakPoint}) {
    flex-direction: row;
  }
`;
export const ContainerBody = styled.div`
  flex: 2;
  position: relative;
  padding-top: 1.5em;

  &:after {
    content: '';
    display: block;
    position: absolute;

    top: 0;
    left: 0;
    right: 0;

    width: auto;
    height: 1px;
    background-color: currentColor;
  }

  @media (min-width: ${breakPoint}) {
    padding-top: unset;
    padding-left: 3em;

    &:after {
      right: unset;
      bottom: 0;

      width: 1px;
      height: auto;
    }
  }
`;

export const SimulatorWrapper = styled.div`
  flex: 3;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 1.5em;

  @media (min-width: ${breakPoint}) {
    padding-bottom: unset;
    padding-right: 3em;
  }
`;

export const SimulatorHeader = styled.p`
  font-size: 1.25em;
`;
export const SimulatorFormWrapper = styled.div`
  width: 100%;
  align-items: center;
  max-width: 700px;
  align-self: center;
  display: flex;
  flex-direction: column;

  @media (min-width: 992px) {
    flex-direction: row;
  }

  @media (min-width: ${breakPoint}) {
    max-width: none;
    align-self: unset;
  }
`;
export const SimulatorForm = styled.form`
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  @media (min-width: 992px) {
    flex: 1;
  }

  fieldset {
    padding: 0;
    border: none;
    margin: 0 0 0.75em 0;
    text-align: right;

    &:last-child {
      margin: 0;
    }
  }
`;
export const SimulatorFormResult = styled.div<{ inline?: boolean }>`
  margin: 1em 0;

  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 0.55em;
  max-width: calc(230px + 0.55em);

  @media (min-width: 992px) {
    margin-left: 3em;
  }

  ${({ inline }) =>
    inline &&
    css`
      width: auto;
      margin-left: 0em;
      flex-wrap: nowrap;
      max-width: none;
      justify-content: stretch;
      align-items: stretch;

      @media (min-width: 992px) {
        flex-direction: row;
      }
    `}

  & > .cartridge {
    font-size: 0.95rem;
    line-height: 1.2;
    padding: 1em;

    ${({ inline }) =>
      inline
        ? css`
            flex: 1;
            margin: 0 0.5em;
          `
        : css`
            &:not(:last-child) {
              margin-bottom: 1em;
            }
          `}
  }
  .simulator-result-economy {
    .simulator-result-economy__result {
      display: flex;
      flex-direction: row;
      justify-content: stretch;
      align-items: center;

      strong {
        display: block;
        width: 3em;
        font-size: 2.95em;
        padding: 0 0.2em 0 0;
        line-height: 1;
        text-align: right;
      }
    }

    .simulator-result-economy__tips {
      clear: both;
      margin-top: 1em;
      padding-top: 1em;
      border-top: 1px solid #ffffff64;
      display: flex;
      align-items: center;
      justify-content: stretch;
      font-size: 0.75rem;

      strong.tonne {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        font-size: 0.7rem;

        em {
          font-style: normal;
          font-weight: bold;
          font-size: 3.25em;
          height: 1em;
          line-height: 1;
          margin-top: -0.15em;
        }
      }
      strong.equal {
        min-width: 1.5em;
        display: inline-block;
        text-align: center;
        font-size: 1.5rem;
      }
    }
  }

  .simulator-result-reduction {
    font-size: 0.75rem;

    @media (max-width: 991px) {
      margin-top: 1em;
    }

    @media (min-width: 992px) {
      display: flex;
      flex-direction: column;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }

    ${({ inline }) =>
      inline &&
      css`
        flex-direction: column;
        justify-content: center;
      `}

    strong {
      font-weight: normal;
      font-size: 1.5rem;
      padding: 0 0.2em 0 0;
      line-height: 1;
      text-align: right;

      @media (max-width: 991px) {
        float: left;
      }

      @media (min-width: 992px) {
        width: 4em;
      }
    }
  }
`;
export const SimulatorFooter = styled.div`
  padding-top: 1.5rem;
  font-size: 0.7em;
  line-height: 1.25;
`;

export const SimulatorBodyWrapper = styled.div``;
