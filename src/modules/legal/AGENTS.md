# legal module

Public legal pages: privacy policy and legal notice, written in French for the site's users.

- `content/*.mdx` — the text (GFM tables enabled). Kept to the legal minimum: RGPD art. 13 (controller, DPO, purposes, legal bases, recipients, transfers, retention, rights, CNIL) and LCEN art. 6-III (publisher, publication director, host). Every change is reviewed with the ADEME DPO; the review history lives outside the repo (homologation folder).
- `client/LegalArticle.tsx` — renders an MDX content with styled tables and external links opened in a new tab.
- Pages: `src/pages/politique-de-confidentialite.tsx`, `src/pages/mentions-legales.tsx`, `src/pages/cgu.tsx` (thin wrappers in `SimplePage`). The CGU (`content/cgu.mdx`) are accepted at registration (`accept_cgu`): a substantive change should bump their version and date.
- Any new third-party service receiving personal data, new tracker or new retention rule MUST be added to `content/politique-de-confidentialite.mdx` in the same PR.
