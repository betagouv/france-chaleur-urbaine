export type MapPopupInfos = {
  latitude: number;
  longitude: number;
  content: { [x: string]: any };
};

export type MapMarkerInfos = {
  key: string;
  latitude: number;
  longitude: number;
  color?: string;
  popup?: boolean;
  popup_content?: string;
};
