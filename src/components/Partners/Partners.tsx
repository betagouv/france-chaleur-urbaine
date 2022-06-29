import Slice from '@components/Slice';
import { partnerData } from '@data/partenaires';
import { PartnerImage, PartnerImages } from './Partners.style';

const Partners = () => {
  return (
    <Slice
      padding={10}
      className="--slice-schema-container"
      header={`
## Notre réseau de partenaires

Plusieurs acteurs soutiennent France Chaleur Urbaine : ils contribuent au développement du service, apportent des données, utilisent le service ou s’en font le relais.
`}
    >
      <PartnerImages>
        {partnerData
          .map(({ image, title, link }) => ({
            image,
            title,
            link,
            sort: Math.random(),
          }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ image, title, link }) => (
            <PartnerImage
              key={title}
              src={image}
              alt={title}
              onClick={() => window.open(link)}
            />
          ))}
      </PartnerImages>
    </Slice>
  );
};

export default Partners;
