export default {
  plugins: {
    'postcss-import': {
      filter: (path) => {
        // Exclude react-dsfr as it breaks the build https://github.com/codegouvfr/react-dsfr/issues/358
        return !path.includes('dsfr');
      },
    },
    tailwindcss: {},
    autoprefixer: {},
  },
};
