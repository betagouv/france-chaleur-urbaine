import { Demand } from 'src/types/Summary/Demand';
import { Name, OtherInfo } from './Contact.styles';

const Contact = ({ demand }: { demand: Demand }) => {
  return (
    <>
      <Name>
        {demand.Prénom && demand.Prénom} {demand.Nom}
      </Name>
      {demand.Établissement && <div>{demand.Établissement}</div>}
      {demand.Mail && (
        <OtherInfo>
          <a href={`mailto:${demand.Mail}`}>{demand.Mail}</a>
        </OtherInfo>
      )}
      {demand.Téléphone && <OtherInfo>{demand.Téléphone}</OtherInfo>}
    </>
  );
};

export default Contact;
