import {Injectable} from "@angular/core";
import {LatLng} from "leaflet";
import {HttpClient, HttpResponse} from "@angular/common/http";
import {Observable} from "rxjs/index";
import {BERLIN, City} from "../data/cities.data";
import {MetroLine} from "../data/metro.data";
import {Station} from "../data/station.data";
@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  public lines: MetroLine[] = [];
  public stationMap: Map<string, Station> = new Map<string, Station>();
  public city: City = BERLIN;


  constructor(private http: HttpClient) {
  }


  public mapMetrolineData(response): MetroLine[] {
    this.lines = [];
    this.stationMap = new Map<string, Station>();
    for (let lineData of response.body.elements) {
      let stationIDs = lineData.members.filter(s => s.type == "node").map(s => s.ref);
      let line: MetroLine = new MetroLine(lineData.id, lineData.tags.ref, lineData.tags.colour, stationIDs, lineData.tags.to);
      this.lines.push(line);

      for (let i = 0; i < stationIDs.length; i++) {
        let id = stationIDs[i];
        let station: Station = null;
        if (!this.stationMap.has(id)) {
          station = new Station(id);
          this.stationMap.set(id, station);
        } else {
          station = this.stationMap.get(id);
        }
        if (i < stationIDs.length - 1) {
          station.addLink(stationIDs[i + 1], line);
        }
      }
    }
    return this.lines;
  }


  private handleDuplicateStation(station: Station, duplicateStationID: string) {
    let deletedStation = this.stationMap.get(duplicateStationID);

    station.addOutgoingLinks(deletedStation.outgoingStationLinks);

    let linesWithDuplicates = this.lines.filter(l => l.stationIDs.includes(duplicateStationID));
    for (let line of linesWithDuplicates) {
      let i = line.stationIDs.indexOf(duplicateStationID);
      line.stationIDs[i] = station.id;

      if (i > 0) {
        let preStationID = line.stationIDs[i - 1];
        let preStation = this.stationMap.get(preStationID);
        let linkWithDuplicateID = preStation.outgoingStationLinks.find(l => l.outgoingStationID == duplicateStationID);
        linkWithDuplicateID.outgoingStationID = station.id;
      }
    }

    this.stationMap.delete(duplicateStationID);
  }

  public mapStationData(response): Map<string, Station> {
    for (let stationData of response.body.elements) {
      let name = stationData.tags.name;
      let latLng = new LatLng(stationData.lat, stationData.lon);

      let station = Array.from(this.stationMap.values()).find(s => s.name == name);
      if (station) {
        this.handleDuplicateStation(station, stationData.id)
      } else {
        let station = this.stationMap.get(stationData.id);
        station.name = name;
        station.setLatLng(latLng);
      }
    }
    this.calculateSchematicLatLngOfStations();
    return this.stationMap;
  }

  private calculateSchematicLatLngOfStations() {
    for (let s of Array.from(this.stationMap.values())) {
      if (s.outgoingStationLinks.length > 2) {
        s.setSchematicLatLng(s.getLatLngCoordinates());
      }
    }

    this.lines.forEach(line => {
      let stations = this.getStationsOfIDs(line.stationIDs);
      if (stations.filter(s => !s.hasSchematicLatLng()).length > 0) {
        let indicesOfSchematicStations = stations.filter(s => s.outgoingStationLinks.length > 2).map(s => stations.indexOf(s));

        let start = 0;
        let end = stations.length - 1;

        if (indicesOfSchematicStations.length > 0) {
          indicesOfSchematicStations.forEach(i => {
            this.schematize(stations, start, i);
            start = i;
          });
          this.schematize(stations, start, end);
        } else {
          this.schematize(stations, start, end);
        }
      }
    });

    for (let s of Array.from(this.stationMap.values())) {
      if (!s.hasSchematicLatLng()) {
        s.setSchematicLatLng(s.getLatLngCoordinates());
      }
    }
  }


  private schematize(stations: Station[], start: number, end: number) {
    if (start >= end && (start - end) < 1) {
      return;
    }

    if ((start == 0 && stations[start].outgoingStationLinks.length < 2)
      || (end == stations.length - 1 && stations[end].outgoingStationLinks.length < 2)) {
      let fixedStation = start == 0 ? stations[end] : stations[start];

      let latDistance = stations[start].getLatDistanceTo(stations[end].getLatLngCoordinates().lat);
      let lngDistance = stations[start].getLngDistanceTo(stations[end].getLatLngCoordinates().lng);
      if (latDistance < 2500 && latDistance < lngDistance) {
        let newLat = fixedStation.getLatLngCoordinates().lat;
        this.schematizeHorizontally(stations, start, end, newLat);
      } else if (lngDistance < 2500) {
        let newLng = fixedStation.getLatLngCoordinates().lng;
        this.schematizeVertically(stations, start, end, newLng);
      } else {
        this.schematizeDiagonal(stations, start, end);
      }
    } else {
      this.schematizeDiagonal(stations, start, end);
    }
  }

  private schematizeHorizontally(stations: Station[], start: number, end: number, newLat) {
    let n = end - start;
    let lngDist = (stations[start].getLatLngCoordinates().lng - stations[end].getLatLngCoordinates().lng) / n;

    stations[start].setSchematicLatLng(new LatLng(newLat, stations[start].getLatLngCoordinates().lng));
    for (let i = start + 1; i <= end; i++) {
      let newLng = stations[i - 1].getLatLngCoordinates().lng - lngDist;
      stations[i].setSchematicLatLng(new LatLng(newLat, newLng));
    }
  }

  private schematizeVertically(stations: Station[], start: number, end: number, newLng) {
    let n = end - start;
    let latDist = (stations[start].getLatLngCoordinates().lat - stations[end].getLatLngCoordinates().lat) / n;

    stations[start].setSchematicLatLng(new LatLng(stations[start].getLatLngCoordinates().lat, newLng));
    for (let i = start + 1; i <= end; i++) {
      let newLat = stations[i - 1].getLatLngCoordinates().lat - latDist;
      stations[i].setSchematicLatLng(new LatLng(newLat, newLng));
    }
  }

  private schematizeDiagonal(stations: Station[], start: number, end: number) {
    stations[start].setSchematicLatLng(stations[start].getLatLngCoordinates());
    stations[end].setSchematicLatLng(stations[end].getLatLngCoordinates());
    if (end - start - 1 <= 0) {
      return;
    }

    let n = end - start;
    let latDist = (stations[start].getLatLngCoordinates().lat - stations[end].getLatLngCoordinates().lat) / n;
    let lngDist = (stations[start].getLatLngCoordinates().lng - stations[end].getLatLngCoordinates().lng) / n;
    let startLatLng = stations[start].getLatLngCoordinates();
    for (let i = start + 1; i < end; i++) {
      let m = i - start;
      let lat = stations[i - 1].getLatLngCoordinates().lat - latDist;
      let lng = stations[i - 1].getLatLngCoordinates().lng - lngDist;
      stations[i].setSchematicLatLng(new LatLng(lat, lng));
    }
  }


  private getStationsOfIDs(stationIDs: string[]): Station[] {
    let stations = [];
    for (let id of stationIDs) {
      stations.push(this.stationMap.get(id));
    }
    return stations;
  }

  public requestMetroLineData(): Observable<HttpResponse<any>> {
    let url = "https://www.overpass-api.de/api/interpreter?" +
      "data=[out:json];" +
      "relation[route=subway]" +
      //"relation[line=light_rail]" +
      this.city.boundingBox +
      ";out%20meta;";
    console.log(url);
    return this.http.get(url, {observe: 'response'});
  }

  public requestStationData(stationIDs: string[]): Observable<HttpResponse<any>> {
    let url_prefix = "https://www.overpass-api.de/api/interpreter?" +
      "data=[out:json];" +
      "node(id:";
    let url_suffix = ");out%20meta;";
    let url_IDs = "";
    for (let id of stationIDs) {
      url_IDs = url_IDs + id + ",";
    }
    url_IDs = url_IDs.slice(0, url_IDs.length - 1);
    let url = url_prefix + url_IDs + url_suffix;
    console.log(url);
    return this.http.get(url, {observe: 'response'});
  }

}
