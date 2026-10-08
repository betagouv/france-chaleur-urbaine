import SearchBar from '@codegouvfr/react-dsfr/SearchBar';
import dynamic from 'next/dynamic';

import Select from '@/components/form/dsfr/Select';

import type { CcrtDemand } from '../types';
import { ccrtDemandExportColumns } from './ccrt-demand-export';

const ButtonExport = dynamic(() => import('@/components/ui/ButtonExport'), { ssr: false });

type CcrtDemandToolbarProps = {
  search: string;
  status: string;
  statusOptions: { label: string; value: string }[];
  demands: CcrtDemand[];
  onSearchChange: (search: string) => void;
  onStatusChange: (status: string) => void;
};

/**
 * Search, status filter and spreadsheet export for the visible demand list.
 */
export function CcrtDemandToolbar({ search, status, statusOptions, demands, onSearchChange, onStatusChange }: CcrtDemandToolbarProps) {
  return (
    <div className="flex flex-wrap items-end gap-4 bg-(--background-default-grey) p-4">
      <div className="min-w-60 grow basis-1/2">
        <label htmlFor="search-ccrt-demand-search-input" className="fr-label mb-2">
          Rechercher
        </label>
        <SearchBar
          id="ccrt-demand-search"
          label="Rechercher une demande"
          renderInput={({ className, id, type }) => (
            <input
              id={id}
              className={className}
              type={type}
              value={search}
              placeholder="Nom, adresse, n° de demande…"
              onChange={(event) => onSearchChange(event.target.value)}
            />
          )}
          onButtonClick={() => onSearchChange(search)}
        />
      </div>
      <Select
        className="mb-0 w-72"
        label="Statut"
        options={[{ label: 'Tous les statuts', value: '' }, ...statusOptions]}
        nativeSelectProps={{ onChange: (event) => onStatusChange(event.target.value), value: status }}
      />
      <ButtonExport
        filename="demandes-chaleur-renouvelable-ccrt.xlsx"
        sheets={[{ columns: ccrtDemandExportColumns, data: demands, name: 'Demandes' }]}
        priority="tertiary"
        size="large"
        iconId="fr-icon-download-line"
        iconPosition="right"
        disabled={demands.length === 0}
      >
        Télécharger (excel)
      </ButtonExport>
    </div>
  );
}
