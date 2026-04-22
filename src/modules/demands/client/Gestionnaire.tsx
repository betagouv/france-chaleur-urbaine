import type { Demand } from '../types';

const Gestionnaire = ({ demand }: { demand: Demand }) => {
  const gestionnaires = demand.Gestionnaires || [];
  const affectationGestionnaire = demand['Affecté à'];

  const allGestionnaires = [...new Set([...gestionnaires, ...(affectationGestionnaire ? [affectationGestionnaire].flat() : [])])].filter(
    Boolean
  );

  if (allGestionnaires.length === 0) {
    return <div className="text-gray-400 text-sm">Non affecté</div>;
  }

  return (
    <div className="w-full leading-5">
      {allGestionnaires.map((gestionnaire, index) => (
        <div key={index} className="font-medium">
          {gestionnaire}
        </div>
      ))}
    </div>
  );
};

export default Gestionnaire;
