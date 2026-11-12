import Alert from '@codegouvfr/react-dsfr/Alert';

import trpc from '@/modules/trpc/client';

import type { CustomTerritoryRecipe } from '../constants';

type RecipePreviewProps = {
  recipe: CustomTerritoryRecipe;
};

/**
 * Live resolution of a recipe: number of communes covered, broken down by département,
 * so the admin can check the result before saving.
 */
function RecipePreview({ recipe }: RecipePreviewProps) {
  const preview = trpc.customTerritories.admin.previewRecipe.useQuery(recipe, { enabled: recipe.include.length > 0 });

  if (recipe.include.length === 0) {
    return <Alert small severity="info" description="Ajoutez au moins un territoire à inclure pour voir les communes couvertes." />;
  }
  if (preview.isLoading) {
    return <Alert small severity="info" description="Calcul des communes couvertes…" />;
  }
  if (!preview.data || preview.data.communes_count === 0) {
    return <Alert small severity="warning" description="Cette recette ne couvre aucune commune." />;
  }
  return (
    <Alert
      small
      severity="success"
      description={
        <>
          <strong>{preview.data.communes_count} communes</strong> couvertes :{' '}
          {preview.data.by_departement.map((departement) => `${departement.nom} (${departement.communes_count})`).join(', ')}
        </>
      }
    />
  );
}

export default RecipePreview;
