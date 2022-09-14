import React from 'react';
import { Point } from 'src/types/Point';
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
      className={isEligible ? 'eligible' : 'ineligible'}
      isClickable
    >
      <header onClick={onClickHandler}>{result.address}</header>
      {onClickClose && (
        <button className="closeButton" onClick={onCloseHandler} />
      )}
      <section>
        <EligibilityResult isEligible={isEligible}>
          {isEligible
            ? `Bonne nouvelle ! Un réseau de chaleur passe à proximité de cette adresse.`
            : `D'après nos données, il n'y a pour le moment pas de réseau de chaleur à proximité de cette adresse.`}
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
