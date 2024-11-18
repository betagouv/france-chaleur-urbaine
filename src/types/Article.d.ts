export interface Article {
  slug: string;
  title: string;
  image: string;
  content: string;
  publishedDate: Date;
  themes: Theme[];
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
