import { Demand } from 'src/types/Summary/Demand';
import { Email, Name } from './Contact.styles';

const Contact = ({ demand }: { demand: Demand }) => {
  return (
    <>
      <Name>
        {demand.Prénom && demand.Prénom} {demand.Nom}
      </Name>
      {demand.Mail && (
        <Email>
          <a href={`mailto:${demand.Mail}`}>{demand.Mail}</a>
        </Email>
      )}
    </>
  );
};

export default Contact;
