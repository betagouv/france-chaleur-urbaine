import { useStore } from '@tanstack/react-form';

import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';

import { type CreateCustomTerritoryInput, zCreateCustomTerritory } from '../constants';
import type { CustomTerritory } from '../types';
import RecipePreview from './RecipePreview';
import TerritoryRefsInput from './TerritoryRefsInput';

type CustomTerritoryFormProps = {
  territory?: Pick<CustomTerritory, 'id' | 'name' | 'recipe'>;
  loading?: boolean;
  onSubmit: (data: CreateCustomTerritoryInput) => Promise<void> | void;
};

/**
 * Create / edit form of a custom territory: a name and a recipe (included territories minus excluded ones),
 * with a live preview of the communes covered.
 */
function CustomTerritoryForm({ territory, onSubmit, loading }: CustomTerritoryFormProps) {
  const isNew = !territory?.id;

  const form = useAppForm({
    ...schemaValidation(zCreateCustomTerritory),
    defaultValues: {
      name: territory?.name ?? '',
      recipe: territory?.recipe ?? { exclude: [], include: [] },
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });
  const recipe = useStore(form.store, (state) => state.values.recipe);

  return (
    <Form form={form}>
      <div className="space-y-6">
        <form.AppField name="name">
          {(field) => (
            <field.TextField label="Nom du territoire" nativeInputProps={{ placeholder: 'Pyrénées-Atlantiques hors CA Pays Basque' }} />
          )}
        </form.AppField>
        <form.AppField name="recipe.include">
          {(field) => (
            <field.CustomField
              Component={TerritoryRefsInput}
              label="Territoires inclus"
              hintText="Communes, EPCI, EPT, départements ou régions dont les communes forment le territoire"
            />
          )}
        </form.AppField>
        <form.AppField name="recipe.exclude">
          {(field) => (
            <field.CustomField
              Component={TerritoryRefsInput}
              label="Territoires exclus"
              hintText="Leurs communes sont retirées du résultat (par exemple la métropole d'un département)"
            />
          )}
        </form.AppField>
        <RecipePreview recipe={recipe} />
        <div className="flex justify-end">
          <form.SubmitButton loading={loading}>{isNew ? 'Créer le territoire' : 'Enregistrer'}</form.SubmitButton>
        </div>
      </div>
    </Form>
  );
}

export default CustomTerritoryForm;
