import {Component, HostListener} from "@angular/core";
import {latLng, LatLng, MapOptions, polyline, tileLayer} from "leaflet";
import {DatabaseService} from "./services/database.service";
import {GeocodingService} from "./services/geocoding.service";
import {MetroLine} from "./data/metro.data";
import {Station, StationLink} from "./data/station.data";
import {PacmanEntity} from "./data/pacman.data";
import {GhostEntity} from "./data/ghost.data";
import {HomeEntity} from "./data/home.data";
import {TargetEntity} from "./data/target.data";
import {FruitEntity} from "./data/fruit.data";

export enum KEY_CODE {
  SPACE = 32,
  L = 76,
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {


  private tileLayer =
    tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    });

  public mapOptions: MapOptions = {};
  public isSchematic = false;
  public numberOfLives: number = 3;
  public score: number = 0;

  public isLayerInitLoading: boolean = true;
  public isHandlingInput: boolean = false;
  public gameover: boolean = false;
  public won: boolean = false;

  private currentPos: LatLng = null;
  public target: TargetEntity = null;
  public home: HomeEntity = null;
  private ghosts: GhostEntity[] = [];
  private fruits: FruitEntity[] = [];
  public pacman: PacmanEntity = null;

  public layers = [];

  public lines: MetroLine[] = null;
  public stationMap: Map<string, Station> = null;

  constructor(private databaseService: DatabaseService,
              private geocodingService: GeocodingService) {
  }

  private ngOnInit() {
    this.initOptions();
    this.requestData();
    this.requestCurrentPositionAndInitHome();
  }

  private initOptions() {
    let city = this.databaseService.city;
    this.mapOptions = {
      layers: [],
      zoom: 11,
      center: latLng([city.lat, city.lng])
    };
  }


  private requestData() {
    this.databaseService.requestMetroLineData().subscribe((response) => {
      this.lines = this.databaseService.mapMetrolineData(response);
      let stationIDs = Array.from(this.databaseService.stationMap.keys());
      this.databaseService.requestStationData(stationIDs).subscribe((response) => {
          this.stationMap = this.databaseService.mapStationData(response);
          this.lines = this.databaseService.lines;
          this.drawMapLayers();
        }
      );
    });
  };


  private requestCurrentPositionAndInitHome() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        console.log(position.coords);
        this.currentPos = new LatLng(position.coords.latitude, position.coords.longitude);
        this.drawMapLayers();
      });
    }
  }


  public changeCoordinatesMode() {
    this.isSchematic = !this.isSchematic;
    this.isLayerInitLoading = true;
    this.redrawMapLayers();
  }

  private drawMapLayers() {
    if (this.stationMap === null || this.currentPos === null) {
      return;
    }

    this.drawMetroLines();
    this.drawHome();
    this.drawPacMan();
    this.drawGhosts();
    this.drawFruits();

    this.updateLayers();
    this.isLayerInitLoading = false;
  }

  private updateLayers() {
    this.layers = [];
    this.lines.forEach(l => this.layers.push(l.polyline));
    Array.from(this.stationMap.values()).forEach(s => this.layers.push(s.marker));

    if (this.isSchematic) {
      this.ghosts.forEach(g => this.layers.push(g.marker));
      this.fruits.forEach(f => this.layers.push(f.marker));
    } else {
      this.layers.push(this.tileLayer);
      this.layers.push(this.home.marker);
      if (this.target != null) {
        this.layers.push(this.target.marker);
      }
    }

    this.layers.push(this.pacman.marker);
  }

  private redrawMapLayers() {
    this.drawMetroLines();
    this.drawPacMan();

    this.updateLayers();
    this.isLayerInitLoading = false;
  }

  private drawMetroLines() {
    Array.from(this.stationMap.values()).forEach(s => s.marker = null);
    for (let line of this.lines) {
      let stations: Station[] = line.stationIDs.map(id => this.stationMap.get(id));
      let stationsLatLng = stations.map(s => s.getLatLng(this.isSchematic));
      line.polyline = polyline(stationsLatLng, {color: line.color, weight: 10});

      for (let station of stations) {
        if (station.marker === null) {
          station.createMarker(this.isSchematic);
        }
        station.addLineInfoToMarkersTooltip(line);
      }
    }
  }

  private drawHome() {
    this.home = new HomeEntity(this.currentPos, this.findClosestStationLatLng(this.currentPos));
  }

  private drawPacMan() {
    let pacmanStation = this.home.closestStation;
    let pacmanMetroLine = this.lines.find(line => line.stationIDs.includes(pacmanStation.id));
    this.pacman = new PacmanEntity(pacmanStation, pacmanMetroLine, this.isSchematic);
  }

  private drawGhosts() {
    this.ghosts = [];
    let GHOST_AMOUNT = this.stationMap.size / 15;
    for (let i = 0; i < GHOST_AMOUNT; i++) {
      let ghost = new GhostEntity(this.getRandomStation());
      this.ghosts.push(ghost);
    }
  }

  private drawFruits() {
    if (this.fruits.length == 0) {
      let FRUITS_AMOUNT = this.stationMap.size / 20;
      for (let i = 0; i < FRUITS_AMOUNT; i++) {
        let fruit = new FruitEntity(this.getRandomStation());
        this.fruits.push(fruit);
      }
    }
  }

  private changeLineOfPacman() {
    let linesOfCurrentStation = this.lines.filter(l => l.stationIDs.includes(this.pacman.currentStation.id));
    let i = linesOfCurrentStation.indexOf(this.pacman.currentLine);
    if (i < linesOfCurrentStation.length - 1) {
      i++;
    } else {
      i = 0;
    }
    this.pacman.currentLine = linesOfCurrentStation[i];

  }

  private movePacman() {
    let nextID = this.pacman.currentLine.getNextStationID(this.pacman.currentStation.id);
    if (nextID == this.pacman.currentStation.id) {
      this.pacman.currentLine = this.getLineOfOppositeDirection(this.pacman.currentLine);
      nextID = this.pacman.currentLine.getNextStationID(this.pacman.currentStation.id);
    }
    let station = this.stationMap.get(nextID);
    this.pacman.moveToStation(station, this.isSchematic);
  }

  private moveAllGhosts() {
    for (let ghost of this.ghosts) {
      let randomIndex = Math.floor(Math.random() * (ghost.currentStation.outgoingStationLinks.length));
      let link: StationLink = ghost.currentStation.outgoingStationLinks[randomIndex];
      let nextStation = this.stationMap.get(link.outgoingStationID);
      if (nextStation) {
        ghost.currentStation = nextStation;
        ghost.marker.setLatLng(ghost.currentStation.getLatLng(this.isSchematic));
      }
    }
  }

  private detectCollisionWithGhosts() {
    if (this.ghosts.find(g => g.currentStation.name == this.pacman.currentStation.name)) {
      this.numberOfLives--;
      if (this.numberOfLives === 0) {
        this.gameover = true;
      }
      this.pacman.moveToStation(this.home.closestStation, this.isSchematic);
      this.pacman.currentLine = this.lines.find(line => line.stationIDs.includes(this.pacman.currentStation.id));
    }
  }

  private detectCollisionWithFruits() {
    let fruitIndex = this.fruits.findIndex(f => f.currentStation.name == this.pacman.currentStation.name);
    if (fruitIndex >= 0) {
      this.layers.splice(this.layers.findIndex(obj => obj == this.fruits[fruitIndex].marker), 1);
      this.fruits.splice(fruitIndex, 1);

      this.score += 50;
      if (this.fruits.length == 0) {
        this.won = true;
      }
    }
  }


  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (!this.gameover && !this.won) {
      if (event.keyCode === KEY_CODE.SPACE) {
        this.movePacman();
        if (this.isSchematic) {
          this.moveAllGhosts();
          this.detectCollisionWithGhosts();
          this.detectCollisionWithFruits();
        } else {
          if (this.target != null && this.pacman.currentStation.name == this.target.closestStation.name) {
            this.won = true;
          }
        }
      }

      if (event.keyCode === KEY_CODE.L) {
        this.changeLineOfPacman();
      }
    }
  }

  private getLineOfOppositeDirection(line: MetroLine) {
    return this.lines.find(l => l.name == line.name && l.lastStationName != line.lastStationName);
  }

  private findClosestStationLatLng(latlng: LatLng): Station {
    let stations = Array.from(this.stationMap.values());
    let station = stations[0];
    let minDistance = station.getLatLng(this.isSchematic).distanceTo(latlng);

    this.stationMap.forEach(s => {
      if (s.getLatLng(this.isSchematic)) {
        let distance = s.getLatLng(this.isSchematic).distanceTo(latlng);
        if (distance < minDistance) {
          minDistance = distance;
          station = s;
        }
      }
    });
    return station;
  }

  private getRandomStation(): Station {
    let stations = Array.from(this.stationMap.values());
    let randomIndex = Math.floor(Math.random() * (stations.length - 1));
    return stations[randomIndex];
  }

  public handleInput(input: string) {
    this.isHandlingInput = true;
    this.geocodingService.requestCoordinates(input).subscribe((response) => {
      let latLng = this.geocodingService.mapResponseToLatLng(response);
      let address = this.geocodingService.mapResponseToAddress(response);
      let closestStation = this.findClosestStationLatLng(latLng);
      this.target = new TargetEntity(latLng, closestStation, address);
      this.updateLayers();
      this.isHandlingInput = false;
    });
  }
}
