import { Demand } from 'src/types/Summary/Demand';
import Tag from './Tag';

const Addresse = ({ demand }: { demand: Demand }) => {
  return (
    <div>
      {demand.Adresse}
      {demand['en ZDP'] && <Tag text="ZDP" />}
    </div>
  );
};

export default Addresse;
