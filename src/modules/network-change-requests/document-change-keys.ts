/** Inclusion keys of the documents of a fiche request: one per added file, one per removal proposed by the submitter. */
export const documentChangeKey = (fileId: string) => `document:${fileId}`;
export const documentRemovalChangeKey = (fileId: string) => `document-removal:${fileId}`;
