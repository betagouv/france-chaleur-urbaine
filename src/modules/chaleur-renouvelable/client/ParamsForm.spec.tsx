import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { type BatEnrBatiment, DEFAULT_SIMULATION_PARAMS } from '../constants';
import type { ChoixChauffageParams } from './hooks/useChoixChauffageQueryParams';
import { ParamsForm } from './ParamsForm';

const prefill = vi.hoisted(() => vi.fn().mockResolvedValue({}));
vi.mock('@/modules/trpc/client', () => ({ default: { useUtils: () => ({ batEnr: { getSimulationPrefill: { fetch: prefill } } }) } }));

vi.mock('@/modules/analytics/client', () => ({ trackPostHogEvent: vi.fn() }));
vi.mock('./BatEnrBatimentsMap', () => ({
  BatEnrBatimentsMap: ({ batiments, onSelect }: { batiments: BatEnrBatiment[]; onSelect: (batiment: BatEnrBatiment) => void }) =>
    batiments.map((batiment) => (
      <button key={batiment.batiment_construction_id} type="button" onClick={() => onSelect(batiment)}>
        Choisir {batiment.batiment_construction_id}
      </button>
    )),
}));
vi.mock('@/modules/form/AddressField', () => ({
  AddressField: ({ onClear }: { onClear: () => void }) => (
    <button type="button" onClick={onClear}>
      Effacer l’adresse
    </button>
  ),
}));

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

const batiment = {
  ac1: null,
  ac2: null,
  ac3: null,
  ac4: null,
  ac4bis: null,
  adresse: values.adresse,
  batiment_construction_id: 'BATIMENT-1',
  batiment_groupe_id: 'GROUPE-1',
  categorie_majoritaire: 'res col',
  classe_bilan_dpe: 'C',
  couv_sondes_200_2025: null,
  couv_st_ecs_2025: null,
  dpe_representatif_logement_surface_habitable_immeuble: 1_800,
  etat_ppa: null,
  ffo_bat_nb_log: 30,
  geometry: null,
  gis_geo_profonde: null,
  gmi_nappe_200: null,
  gmi_sonde_200: null,
  place_nappe: null,
  pot_nappe: null,
  prod_st_mwh_an: null,
  propri_uni: null,
  type_energie_chauffage: null,
  type_energie_ecs: null,
  type_installation_chauffage: 'collectif',
  type_installation_ecs: 'collectif',
} satisfies BatEnrBatiment;

describe('ParamsForm', () => {
  it.each([
    ['Surface habitable par logement (moy)', '90', String(values.surfaceMoyenne)],
    ['Habitants par logement (moy)', '3', values.habitantsMoyen],
    ['Nombre de logements', '30', String(values.nbLogements)],
    ['Type de radiateurs', 'radiateur-electrique', values.typeRadiateur],
  ])('only enables saving while %s differs from its initial value', (label, changedValue, initialValue) => {
    render(
      <ParamsForm
        batiments={[]}
        isOpen
        onSave={vi.fn()}
        paramSources={{ isDpeExplicit: true, isModeEauChaudeSanitaireInferred: false }}
        setGeoAddress={vi.fn()}
        setIsOpen={vi.fn()}
        values={values}
      />
    );
    const saveButton = screen.getByRole('button', { name: 'Enregistrer et recalculer' });
    const field = screen.getByLabelText(label);
    expect(saveButton).toBeDisabled();

    fireEvent.change(field, { target: { value: changedValue } });
    expect(saveButton).toBeEnabled();

    fireEvent.change(field, { target: { value: initialValue } });
    expect(saveButton).toBeDisabled();
  });

  it('restores saved values on cancel and synchronizes updated URL parameters', () => {
    const onSave = vi.fn();
    const setIsOpen = vi.fn();
    const props = {
      batiments: [],
      isOpen: true,
      onSave,
      paramSources: { isDpeExplicit: true, isModeEauChaudeSanitaireInferred: false },
      setGeoAddress: vi.fn(),
      setIsOpen,
      values,
    };
    const { rerender } = render(<ParamsForm {...props} />);
    const surface = screen.getByLabelText('Surface habitable par logement (moy)');
    fireEvent.change(surface, { target: { value: '90' } });
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(surface).toHaveValue(values.surfaceMoyenne);
    expect(screen.getByRole('button', { name: 'Enregistrer et recalculer' })).toBeDisabled();
    expect(setIsOpen).toHaveBeenCalledWith(false);
    expect(onSave).not.toHaveBeenCalled();

    rerender(<ParamsForm {...props} values={{ ...values, surfaceMoyenne: 60 }} />);
    expect(surface).toHaveValue(60);
    expect(screen.getByRole('button', { name: 'Enregistrer et recalculer' })).toBeDisabled();
  });

  it('keeps an address change pending after the parent updates the URL', () => {
    const props = {
      batiments: [],
      isOpen: true,
      onSave: vi.fn(),
      paramSources: { isDpeExplicit: true, isModeEauChaudeSanitaireInferred: false },
      setGeoAddress: vi.fn(),
      setIsOpen: vi.fn(),
      values,
    };
    const { rerender } = render(<ParamsForm {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Effacer l’adresse' }));
    rerender(<ParamsForm {...props} values={{ ...values, adresse: null }} />);

    expect(screen.getByRole('button', { name: 'Enregistrer et recalculer' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.getByRole('button', { name: 'Enregistrer et recalculer' })).toBeDisabled();
  });

  it('tracks confirmation of an inferred hot water mode even when its value stays the same', () => {
    render(
      <ParamsForm
        batiments={[]}
        isOpen
        onSave={vi.fn()}
        paramSources={{ isDpeExplicit: true, isModeEauChaudeSanitaireInferred: true }}
        setGeoAddress={vi.fn()}
        setIsOpen={vi.fn()}
        values={values}
      />
    );
    const saveButton = screen.getByRole('button', { name: 'Enregistrer et recalculer' });
    expect(saveButton).toBeDisabled();
    fireEvent.blur(screen.getByLabelText('Mode d’eau chaude sanitaire'));
    expect(saveButton).toBeEnabled();
  });

  it('tracks a building selection and saves its prefill without changing the heating mode', async () => {
    const onSave = vi.fn().mockResolvedValue(new URLSearchParams());
    render(
      <ParamsForm
        batiments={[batiment]}
        isOpen
        onSave={onSave}
        paramSources={{ isDpeExplicit: false, isModeEauChaudeSanitaireInferred: true }}
        setGeoAddress={vi.fn()}
        setIsOpen={vi.fn()}
        values={values}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Choisir BATIMENT-1' }));
    await waitFor(() => expect(screen.getByLabelText('Nombre de logements')).toHaveValue(30));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enregistrer et recalculer' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer et recalculer' }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledExactlyOnceWith({
        adresse: values.adresse,
        constructionId: 'BATIMENT-1',
        dpe: 'C',
        espaceExterieur: values.espaceExterieur,
        habitantsMoyen: '2',
        modeEauChaudeSanitaire: 'Collectif',
        nbLogements: 30,
        surfaceMoyenne: 60,
        typeLogement: 'immeuble_chauffage_individuel',
        typeRadiateur: 'radiateur-eau',
      })
    );
  });

  it.each(['untouched', 'edited', 'cancelled'] as const)('handles delayed building prefill when the form is %s', async (state) => {
    const pending = Promise.withResolvers<{ nbLogements: number }>();
    prefill.mockReturnValueOnce(pending.promise);
    const setIsOpen = vi.fn();
    render(
      <ParamsForm
        batiments={[batiment]}
        isOpen
        onSave={vi.fn()}
        paramSources={{ isDpeExplicit: true, isModeEauChaudeSanitaireInferred: false }}
        setGeoAddress={vi.fn()}
        setIsOpen={setIsOpen}
        values={values}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Choisir BATIMENT-1' }));
    const count = screen.getByLabelText('Nombre de logements');
    expect(screen.getByRole('button', { name: 'Enregistrer et recalculer' })).toBeDisabled();
    if (state === 'edited') {
      fireEvent.change(count, { target: { value: '42' } });
    }
    if (state === 'cancelled') {
      fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    }
    await act(async () => pending.resolve({ nbLogements: 78 }));
    expect(count).toHaveValue(state === 'untouched' ? 78 : state === 'edited' ? 42 : values.nbLogements);
    if (state === 'cancelled') {
      expect(setIsOpen).toHaveBeenCalledWith(false);
      expect(screen.getByRole('button', { name: 'Enregistrer et recalculer' })).toBeDisabled();
    }
  });

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
