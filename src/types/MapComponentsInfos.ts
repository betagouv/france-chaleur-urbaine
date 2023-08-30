export type MapPopupInfos = {
  latitude: number;
  longitude: number;
  content: { [x: string]: any };
};

export enum MapPopupType {
  DEFAULT = 'default',
  ENGIE = 'engie',
  DALKIA = 'dalkia',
  VIASEVA = 'viaseva',
}

export type MapMarkerInfos = {
  id: string;
  latitude: number;
  longitude: number;
  color?: string;
  popup?: boolean;
  popupContent?: string;
  onClickAction?: (id: string) => void;
};
