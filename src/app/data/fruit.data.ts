import {Station} from "./station.data";
import {icon, Marker, marker} from "leaflet";

export class FruitEntity {
  public marker: Marker;
  public currentStation: Station;

  constructor(currentStation: Station) {
    this.currentStation = currentStation;
    this.marker = marker(currentStation.getLatLngCoordinates(), {
      icon: icon({
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        tooltipAnchor: [15, 0],
        iconUrl: './../assets/fruit.png',
      })
    });
  }

}
