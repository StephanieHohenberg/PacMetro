import {circleMarker, CircleMarker, LatLng} from "leaflet";
import {MetroLine} from "./metro.data";

export class StationLink {
  constructor(public outgoingStationID: string,
              public line: MetroLine) {
  }
}


export class Station {
  public outgoingStationLinks: StationLink[] = [];
  public name: string;
  private latLng: LatLng;
  private schematicLatLng: LatLng;
  public marker: CircleMarker = null;

  constructor(public id: string) {
  }

  public addLink(outgoingStationID: string, line: MetroLine) {
    this.outgoingStationLinks.push(new StationLink(outgoingStationID, line));
  }

  public addOutgoingLinks(links: StationLink[]) {
    links.forEach(l => {
      this.outgoingStationLinks.push(l);
    });
  }

  public setLatLng(pLatLng: LatLng) {
    this.latLng = pLatLng;
  }

  public setSchematicLatLng(pLatLng: LatLng) {
    this.schematicLatLng = pLatLng;
  }

  public getLatLng(isSchematic: boolean) {
    if (isSchematic && this.hasSchematicLatLng()) {
      return this.schematicLatLng;
    }
    return this.latLng;
  }

  public getLatLngCoordinates(): LatLng {
    if (this.hasSchematicLatLng()) {
      return this.schematicLatLng;
    }
    return this.latLng;
  }

  public hasSchematicLatLng(): boolean {
    return this.schematicLatLng != null && this.schematicLatLng != undefined;
  }


  public getLatDistanceTo(lat: number): number {
    return new LatLng(this.latLng.lat, 0).distanceTo(new LatLng(lat, 0));
  }

  public getLngDistanceTo(lng: number): number {
    return new LatLng(0, this.latLng.lng).distanceTo(new LatLng(0, lng));
  }


  public createMarker(isSchematic: boolean) {
    this.marker = circleMarker(this.getLatLng(isSchematic),
      {
        radius: 1,
        color: "white",
        weight: 8,
        fill: true,
        fillColor: "white",
        fillOpacity: 1,
      });
    this.marker.bindTooltip("<b>" + this.name + "</b>");
  }

  public addLineInfoToMarkersTooltip(line: MetroLine) {
    let tooltipText = this.marker.getTooltip().getContent();
    this.marker.bindTooltip(
      tooltipText
      + "<p><span style='background-color: " + line.color + "; color:white;'>" + line.name + "</span>   " + line.lastStationName + "</p>");
  }


}
