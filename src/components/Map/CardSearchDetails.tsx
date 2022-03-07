import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet/dist/leaflet.css';
import React from 'react';
import { useMap } from 'react-leaflet';
import { EligibilityResult, MapCard } from './CardSearchDetails.style';
import ControlWrapper from './ControlWrapper';

export type AddressDetail = any;

type Result = {
  address: string;
  addressDetails?: AddressDetail;
  coordinates?: L.LatLngExpression;
};
type SearchResult = {
  result: Result;
  onClick?: (result: Result) => void;
  flyOnClick?: boolean | number;
};

const CardSearchDetails = ({ result, onClick, flyOnClick }: SearchResult) => {
  const map = useMap();
  const { distance } = result.addressDetails?.networkDetails?.network || {};
  const { isEligible } = result.addressDetails?.networkDetails || {};

  const onClickHandler = (ev: React.MouseEvent<HTMLElement>) => {
    const returnVal =
      (typeof onClick === 'function' && onClick(result)) || undefined;
    if (flyOnClick && result.coordinates)
      map.flyTo(
        result.coordinates,
        typeof flyOnClick === 'number' ? flyOnClick : 15
      );
    ev.stopPropagation();
    return returnVal;
  };

  return (
    <ControlWrapper event="dblclick mousewheel scroll touchstart">
      <MapCard
        isEligible={isEligible}
        typeCard={'search'}
        onClick={onClickHandler}
        isClickable
      >
        <header>{result.address}</header>
        <section>
          <EligibilityResult isEligible={isEligible}>
            {isEligible
              ? `Bonne nouvelle ! Un réseau de chaleur passe à proximité de cette adresse.`
              : `Cette adresse n'est pour le moment pas raccordable à un réseau de chaleur.`}
          </EligibilityResult>
          <div>
            {distance &&
              `Distance aux reseaux : ${
                distance >= 1000 ? `${distance / 1000}km` : `${distance}m`
              }`}
          </div>
        </section>
      </MapCard>
    </ControlWrapper>
  );
};

export default CardSearchDetails;
