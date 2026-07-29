export default {
  // Regénère l'index de recherche de la doc admin quand une page ou un seuil change,
  // et le stage automatiquement — pas besoin d'y penser. La fonction évite que lint-staged
  // ajoute les noms de fichiers en argument de la commande.
  '{src/modules/doc/content/*.mdx,src/modules/app/business-rules.ts}': () => [
    'pnpm doc:build-search-index',
    'git add src/modules/doc/search-index.generated.ts',
  ],
  '*.{mjs,js,jsx,ts,tsx}': ['pnpm lint:fix:file', 'git add -A'],
};
