import {icon, LatLng, marker, Marker} from "leaflet";
import {Station} from "./station.data";

export class TargetEntity {
  public marker: Marker;
  public closestStation: Station;
  public address: string;

  constructor(latLng: LatLng, closestStation: Station, address: string) {
    this.closestStation = closestStation;
    this.address = address;
    this.marker = marker(latLng, {
      icon: icon({
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        tooltipAnchor: [15, 0],
        iconUrl: './../assets/home.png',
      })
    });
    this.marker.bindTooltip(
      "<p>" + this.address + "</p>"
      + "<p>This is your target. Find the way to its closest station: " + this.closestStation.marker.getTooltip().getContent() + "</p>"
    );

  }
}
