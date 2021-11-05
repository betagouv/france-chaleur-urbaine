import styled from 'styled-components';

export const SectionTitle = styled.h3`
  color: #000091;
`;

export const BodyAccordion = styled.div`
  white-space: pre-wrap;
`;

type BodyAccordionWrapperProps = {
  activeMenu: boolean;
};
export const BodyAccordionWrapper = styled.div.attrs<BodyAccordionWrapperProps>(
  ({ activeMenu }) => ({
    className: `fr-collapse ${activeMenu ? 'fr-collapse--expanded' : ''}`,
    style: activeMenu
      ? {
          '--collapse': '0px',
          maxHeight: 'none',
        }
      : {
          '--collapse': '-40px',
        },
  })
)<BodyAccordionWrapperProps>``;
