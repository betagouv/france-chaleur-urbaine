import Button from '@/components/ui/Button';
import TableBasic from '@/components/ui/TableBasic';

import type { CcrtDemand } from '../types';
import { CcrtDemandRow } from './CcrtDemandRow';
import type { useCcrtDemandActions } from './hooks/useCcrtDemandActions';

type CcrtDemandsTableProps = {
  demands: CcrtDemand[];
  expandedDemandId: string | null;
  isLoading: boolean;
  hasDemands: boolean;
  order: 'asc' | 'desc';
  sort: 'date' | 'status';
  actions: ReturnType<typeof useCcrtDemandActions>;
  onToggle: (demand: CcrtDemand) => void;
  onSort: (sort: 'date' | 'status') => void;
  onValidate?: (demandId: string) => Promise<void>;
};

/**
 * DSFR table composed with demand rows and inline building sheets.
 */
export function CcrtDemandsTable({
  demands,
  expandedDemandId,
  isLoading,
  hasDemands,
  order,
  sort,
  actions,
  onToggle,
  onSort,
  onValidate,
}: CcrtDemandsTableProps) {
  return (
    <TableBasic
      className="m-0! [&>div::after]:hidden!"
      layoutFixed
      tableClassName="w-full min-w-[1240px] table-fixed leading-6 text-(--text-default-grey) [&_th]:h-16 [&_th]:bg-(--background-default-grey)! [&_th]:py-2! [&_th]:text-sm [&_th]:font-bold [&_th]:uppercase [&_td]:bg-transparent! [&_td]:px-4! [&_td]:py-3! [&_td]:text-base [&_td:first-child]:px-2!"
      tableProps={{ 'aria-busy': isLoading }}
    >
      <caption className="sr-only">Demandes d’accompagnement CCRT</caption>
      <colgroup>
        <col className="w-8" />
        <col className="w-[270px]" />
        <col className="w-[219px]" />
        <col className="w-[249px]" />
        <col className="w-[125px]" />
        <col className="w-[178px]" />
        <col className="w-[165px]" />
      </colgroup>
      <thead>
        <tr>
          <th scope="col">
            <span className="sr-only">Détails</span>
          </th>
          <th scope="col">Usager</th>
          <th scope="col">Bâtiment</th>
          <th scope="col">
            <span className="whitespace-nowrap">Résultats de la simulation</span>
          </th>
          <th scope="col" aria-sort={sort === 'date' ? (order === 'desc' ? 'descending' : 'ascending') : 'none'}>
            <div className="flex items-center justify-between gap-2">
              <span>Date</span>
              <Button
                priority="tertiary no outline"
                size="small"
                iconId="fr-icon-arrow-up-down-line"
                title={
                  sort === 'date' && order === 'desc'
                    ? 'Trier de la plus ancienne à la plus récente'
                    : 'Trier de la plus récente à la plus ancienne'
                }
                className="shrink-0 text-(--text-action-high-blue-france)!"
                onClick={() => onSort('date')}
              />
            </div>
          </th>
          <th scope="col" aria-sort={sort === 'status' ? (order === 'desc' ? 'descending' : 'ascending') : 'none'}>
            <div className="flex items-center justify-between gap-2">
              <span>Statut</span>
              <Button
                priority="tertiary no outline"
                size="small"
                iconId="fr-icon-arrow-up-down-line"
                title={sort === 'status' && order === 'asc' ? 'Trier les statuts de Z à A' : 'Trier les statuts de A à Z'}
                className="shrink-0 text-(--text-action-high-blue-france)!"
                onClick={() => onSort('status')}
              />
            </div>
          </th>
          <th scope="col" className="text-center!">
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        {demands.map((demand) => (
          <CcrtDemandRow
            key={demand.id}
            demand={demand}
            isExpanded={expandedDemandId === demand.id}
            isUpdating={actions.isUpdating}
            onToggle={() => onToggle(demand)}
            onContact={(contactType) => actions.trackContact(demand, contactType)}
            onSendEmail={(showHistory, placement) => actions.openEmail(demand, showHistory, placement)}
            onSimulation={(placement) => actions.trackSimulation(demand, placement)}
            onMap={() => actions.trackMap(demand)}
            onManageAccess={() => actions.trackAccess(demand)}
            onUpdate={(values) => actions.updateDemand(demand, values)}
            onValidate={onValidate}
          />
        ))}
        {demands.length === 0 && (
          <tr>
            <td colSpan={7} className="py-12! text-center!">
              <span role="status">
                {isLoading
                  ? 'Chargement des demandes…'
                  : hasDemands
                    ? 'Aucune demande ne correspond aux filtres sélectionnés.'
                    : 'Aucune demande d’accompagnement à afficher.'}
              </span>
            </td>
          </tr>
        )}
      </tbody>
    </TableBasic>
  );
}
