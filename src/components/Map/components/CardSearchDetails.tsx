import React from 'react';
import { Point } from 'src/types';
import { EligibilityResult, MapCard } from './CardDetails.style';

export type TypeAddressDetail = any;

type Result = {
  address: string;
  addressDetails?: TypeAddressDetail;
  coordinates?: Point;
};
type SearchResult = {
  result: Result;
  onClick?: (result: Result) => void;
  onClickClose?: (result: { coordinates?: Point }) => void;
};

const CardSearchDetails = ({ result, onClick, onClickClose }: SearchResult) => {
  const { distance } = result.addressDetails?.networkDetails?.network || {};
  const { isEligible } = result.addressDetails?.networkDetails || {};

  const onClickHandler = (ev: React.MouseEvent<HTMLElement>) => {
    const returnVal =
      (typeof onClick === 'function' && onClick(result)) || undefined;
    ev.stopPropagation();
    return returnVal;
  };

  const onCloseHandler = () => {
    if (onClickClose) {
      onClickClose(result);
    }
  };

  return (
    <MapCard
      isEligible={isEligible}
      typeCard={'search'}
      onClick={onClickHandler}
      className={isEligible ? 'eligible' : 'ineligible'}
      isClickable
    >
      <header>
        {result.address}
        <div className="buttonsWrapper">
          {onClickClose && (
            <div className="closeButton" onClick={onCloseHandler} />
          )}
        </div>
      </header>
      <section>
        <EligibilityResult isEligible={isEligible}>
          {isEligible
            ? `Bonne nouvelle ! Un réseau de chaleur passe à proximité de cette adresse.`
            : `Cette adresse n'est pour le moment pas raccordable à un réseau de chaleur.`}
        </EligibilityResult>
        <div>
          {!isNaN(parseFloat(distance)) &&
            `Distance au réseau ${
              distance < 1
                ? '< 1m'
                : distance >= 1000
                ? `: ${distance / 1000}km`
                : `: ${distance}m`
            }`}
        </div>
      </section>
    </MapCard>
  );
};

export default CardSearchDetails;
