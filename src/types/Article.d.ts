export interface Article {
  slug: string;
  title: string;
  seoTitle?: string;
  image: string;
  content: string;
  publishedDate: Date;
  themes: Theme[];
  abstract: string;
}

type Theme =
  | 'Réseaux de chaleur'
  | 'Réglementation'
  | 'Cartographie et données'
  | 'Infographie'
  | 'Communication'
  | 'ENR&R'
  | 'Réseaux de froid'
  | 'Prix'
  | 'Autre'
  | 'Reportage';
