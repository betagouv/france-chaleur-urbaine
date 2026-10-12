import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_SIMULATION_PARAMS } from '../constants';
import type { ChoixChauffageParams } from './hooks/useChoixChauffageQueryParams';
import { ParamsForm } from './ParamsForm';

vi.mock('@/modules/analytics/client', () => ({ trackPostHogEvent: vi.fn() }));
vi.mock('./BatEnrBatimentsMap', () => ({ BatEnrBatimentsMap: () => null }));
vi.mock('@/modules/form/AddressField', () => ({ AddressField: () => null }));

const values = {
  ...DEFAULT_SIMULATION_PARAMS,
  adresse: '15 Rue de Rivoli 75004 Paris',
  constructionId: null,
  dpe: 'F',
  habitantsMoyen: '2',
  modeEauChaudeSanitaire: 'Individuel',
  originDemandId: null,
  typeLogement: 'immeuble_chauffage_individuel',
  typeRadiateur: 'radiateur-eau',
} satisfies ChoixChauffageParams;

describe('ParamsForm', () => {
  it('blocks an area below 9 m², focuses its error and allows saving after correction', async () => {
    const onSave = vi.fn().mockResolvedValue(new URLSearchParams());
    const setIsOpen = vi.fn();
    render(
      <ParamsForm
        batiments={[]}
        isOpen
        onSave={onSave}
        paramSources={{ isDpeExplicit: true, isModeEauChaudeSanitaireInferred: false }}
        setGeoAddress={vi.fn()}
        setIsOpen={setIsOpen}
        values={values}
      />
    );

    const surface = screen.getByLabelText('Surface habitable par logement (moy)');
    fireEvent.change(surface, { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer et recalculer' }));

    expect(await screen.findByText('La surface doit être d’au moins 9 m² par logement.')).toBeInTheDocument();
    await waitFor(() => expect(surface).toHaveFocus());
    expect(onSave).not.toHaveBeenCalled();
    expect(setIsOpen).not.toHaveBeenCalled();

    fireEvent.change(surface, { target: { value: '9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer et recalculer' }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledExactlyOnceWith({
        adresse: values.adresse,
        constructionId: null,
        dpe: 'F',
        espaceExterieur: values.espaceExterieur,
        habitantsMoyen: '2',
        modeEauChaudeSanitaire: 'Individuel',
        nbLogements: values.nbLogements,
        surfaceMoyenne: 9,
        typeLogement: 'immeuble_chauffage_individuel',
        typeRadiateur: 'radiateur-eau',
      })
    );
    await waitFor(() => expect(setIsOpen).toHaveBeenCalledWith(false));
  });
});
