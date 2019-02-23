import {icon, Marker, marker} from "leaflet";
import {Station} from "./station.data";
import {MetroLine} from "./metro.data";


export class PacmanEntity {
  public marker: Marker;
  public currentStation: Station;
  public currentLine: MetroLine;

  constructor(currentStation: Station, currentLine: MetroLine, isSchematic: boolean) {
    this.currentStation = currentStation;
    this.currentLine = currentLine;
    this.marker = marker(currentStation.getLatLng(isSchematic), {
      icon: icon({
        iconSize: [25, 25],
        iconAnchor: [12, 12],
        tooltipAnchor: [20, 0],
        iconUrl: './../assets/pacman.png',
      })
    });
    this.marker.bindTooltip(
      "Pacman is at " + this.currentStation.name + "   "
      + "<span style='background-color:" + this.currentLine.color + "; color:white;'>" + this.currentLine.name + "</span>"
      + "<p>Move PacMan with your keyboard.</p>");
  }

  moveToStation(station: Station, isSchematic: boolean) {
    this.currentStation = station;
    this.marker.setLatLng(station.getLatLng(isSchematic));
    this.marker.bindTooltip(
      this.currentStation.name + "   "
      + "<span style='background-color: " + this.currentLine.color + "; color:white;'>" + this.currentLine.name + "</span>");

  }

}
