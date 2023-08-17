export type MapPopupInfos = {
  latitude: number;
  longitude: number;
  content: { [x: string]: any };
};

export enum MapPopupType {
  DEFAULT = 'default',
  ENGIE = 'engie',
  VIASEVA = 'viaseva',
}

export type MapMarkerInfos = {
  key: string;
  latitude: number;
  longitude: number;
  color?: string;
  popup?: boolean;
  popupContent?: string;
};
