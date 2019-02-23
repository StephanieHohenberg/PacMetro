import {Station} from "./station.data";
import {icon, LatLng, Marker, marker} from "leaflet";
export class HomeEntity {
  public marker: Marker;
  public closestStation: Station;

  constructor(latLng: LatLng, closestStation: Station) {
    this.closestStation = closestStation;
    this.marker = marker(latLng, {
      icon: icon({
        iconSize: [25, 25],
        iconAnchor: [25, 25],
        iconUrl: './../assets/home.png',
      })
    });
    this.marker.bindTooltip("Here are you.<p>Play with PacMan and get to know the metro system.</p>");
  }
}
