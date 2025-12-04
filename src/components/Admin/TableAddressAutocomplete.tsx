import Badge from '@codegouvfr/react-dsfr/Badge';
import { useState } from 'react';

import AddressAutocomplete from '@/components/form/AddressAutocomplete';
import FCUBadge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import { notify } from '@/modules/notification';
import trpc, { type RouterOutput } from '@/modules/trpc/client';
import { stopPropagation } from '@/utils/events';
import { formatMWh } from '@/utils/strings';

type DemandsListAdminItem = RouterOutput['demands']['admin']['list']['items'][number];

type TableAddressAutocompleteProps = {
  demand: DemandsListAdminItem;
};

export default function TableAddressAutocomplete({ demand }: TableAddressAutocompleteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const testAddress = demand.testAddress;
  const utils = trpc.useUtils();
  const { mutateAsync: updateAddressMutation } = trpc.proEligibilityTests.updateAddress.useMutation();

  if (isEditing) {
    return (
      <div className="p-2 bg-white relative" onClick={stopPropagation} onDoubleClick={stopPropagation}>
        <AddressAutocomplete
          nativeInputProps={{
            autoFocus: true,
            defaultValue: testAddress.ban_address ?? '',
            disabled: isLoading,
          }}
          onSelect={async (address) => {
            if (!testAddress.id) {
              notify('error', "ID de l'adresse manquant");
              return;
            }

            setIsLoading(true);
            try {
              await updateAddressMutation({
                address: address.properties.label,
                addressId: testAddress.id,
                latitude: address.geometry.coordinates[1],
                longitude: address.geometry.coordinates[0],
              });
              notify('success', 'Adresse mise à jour avec succès');
              await utils.demands.admin.list.invalidate();
              setIsEditing(false);
            } catch (error) {
              notify('error', "Erreur lors de la mise à jour de l'adresse");
              setIsEditing(false);
            } finally {
              setIsLoading(false);
            }
          }}
          onClear={() => setIsEditing(false)}
        />
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-500 font-semibold">Valeur précédente :</div>
          <div className="text-xs text-gray-600 italic">{testAddress.ban_address}</div>
        </div>
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
            <Loader />
          </div>
        )}
      </div>
    );
  }

  return (
    <div onClick={() => setIsEditing(true)} className="cursor-pointer hover:bg-gray-50 p-1">
      <div>
        <div className="leading-none tracking-tight">{testAddress.ban_address}</div>
        {!testAddress.ban_valid && (
          <Badge severity="error" small>
            Adresse invalide
          </Badge>
        )}
        {demand['en PDP'] === 'Oui' && <FCUBadge type="pdp" />}
      </div>
      {testAddress.source_address !== testAddress.ban_address && (
        <div className="text-xs italic text-gray-400 tracking-tighter">{testAddress.source_address}</div>
      )}
      {(demand.Logement || demand['Surface en m2'] || demand.Conso) && <div className="border-t border-gray-600 my-2" />}
      {demand.Logement && <div className="text-xs font-bold">{demand.Logement} logements</div>}
      {demand['Surface en m2'] && <div className="text-xs font-bold">{demand['Surface en m2']}m²</div>}
      {demand.Conso && <div className="text-xs font-bold">{formatMWh(demand.Conso)} de gaz</div>}
    </div>
  );
}
