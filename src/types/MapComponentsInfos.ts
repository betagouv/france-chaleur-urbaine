export type MapMarkerInfos = {
  id: string;
  latitude: number;
  longitude: number;
  color?: string;
  popup?: boolean;
  popupContent?: string;
  onClickAction?: (id: string) => void;
};
