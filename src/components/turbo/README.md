# turbo components

This folder contains components that are not compatible with turbo.
Their use should be made through resolveAlias in turbo next config

## DSFR

Issue has been opened and all these can be removed when https://github.com/codegouvfr/react-dsfr/issues/361 is adddressed

For DSFR components:
- replace all `./` includes by `@codegouvfr/react-dsfr/`
- the real problematic part is `getLink` which should be replaced by a normal `Link`

