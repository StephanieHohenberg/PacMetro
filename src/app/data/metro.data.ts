export class MetroLine {

  public polyline = null;

  constructor(public id: string,
              public name: string,
              public color: string,
              public stationIDs: string[],
              public lastStationName: string,) {
  }

  public getNextStationID(stationID: string) {
    let index = this.stationIDs.indexOf(stationID);
    if (index < this.stationIDs.length - 1) {
      return this.stationIDs[index + 1];
    }
    return stationID;
  }

  public getPreviousStationID(stationID: string) {
    let index = this.stationIDs.indexOf(stationID);
    if (index == 0) {
      return stationID;
    }
    return this.stationIDs[index - 1];
  }
}
