import {Injectable} from "@angular/core";
import {HttpClient, HttpResponse} from "@angular/common/http";
import {Observable} from "rxjs/index";
import {LatLng} from "leaflet";
import {DatabaseService} from "./database.service";

@Injectable({
  providedIn: 'root'
})
export class GeocodingService {

  constructor(private http: HttpClient, private databaseService: DatabaseService) {
  }

  public requestCoordinates(input: string): Observable<HttpResponse<any>> {
    let city = this.databaseService.city;

    let address = input.replace(" ", "+");
    if (!address.toLowerCase().includes(city.name.toLowerCase())) {
      address = address + "+" + city.name;
    }

    let url = " https://api.opencagedata.com/geocode/v1/json?q="
      + address
      + "&key=d48a8b1fc76f4a7da6cca94f578565e6";

    console.log(url);
    return this.http.get(url, {observe: 'response'});
  }

  public mapResponseToLatLng(response): LatLng {
    let geometry = response.body.results[0].geometry;
    return new LatLng(geometry.lat, geometry.lng);
  }

  public mapResponseToAddress(response): string {
    console.log(response.body.results[0].formatted);
    return response.body.results[0].formatted;
  }

}
