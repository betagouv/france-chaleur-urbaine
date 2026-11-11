import { useEffect } from 'react';

import { loadGoogleTags } from '@/modules/analytics/google-tag-manager';

type GoogleTagsScriptProps = { tagIds: string[] };

/** Loads legacy Google destinations through the same consent and URL safeguards as GTM. */
export function GoogleTagsScript({ tagIds }: GoogleTagsScriptProps) {
  // Configuration must enter the data layer before scripts start reading the current page.
  useEffect(() => {
    loadGoogleTags(tagIds);
  }, [tagIds]);
  return null;
}
