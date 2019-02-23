export interface City {
  name: string;
  lat: number;
  lng: number;
  boundingBox: string;
}

export const AMSTERDAM: City = {
  name: "Amsterdam",
  lat: 52.367984,
  lng: 4.903561,
  boundingBox: "(52.29798183210937,4.724807739257812,52.44471056482437,5.107269287109375)"
};

export const BERLIN: City = {
  name: "Berlin",
  lat: 52.520008,
  lng: 13.404954,
  boundingBox: "(52.354634948622525,13.114929199218748,52.71300326104201,13.745269775390625)"
};
