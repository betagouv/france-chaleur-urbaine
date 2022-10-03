import { Button } from '@dataesr/react-dsfr';
import styled from 'styled-components';

export const Section = styled.div`
  > :first-child {
    margin-bottom: 32px;
  }
  margin-top: 48px;
`;

export const Hint = styled.div`
  margin-bottom: 8px !important;
`;

export const SectionTitle = styled.div`
  position: relative;
  font-size: 24px;
  font-weight: 700;
  text-decoration: underline;
  width: fit-content;
`;

export const SubSectionTitle = styled.div`
  font-size: 20px;
  font-weight: 700;
  margin: 32px 0 24px 0;
`;

export const SectionDescription = styled.div`
  margin-top: 4px;
`;

export const SubmitButton = styled(Button)`
  margin-top: 32px;
`;
