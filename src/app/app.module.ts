import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from "@angular/core";

import {AppComponent} from "./app.component";
import {LeafletModule} from "@asymmetrik/ngx-leaflet";
import {DatabaseService} from "./services/database.service";
import {HttpClientModule} from "@angular/common/http";
import {MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatSlideToggleModule} from "@angular/material";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {GeocodingService} from "./services/geocoding.service";

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    LeafletModule.forRoot(),
    MatSlideToggleModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,

  ],
  providers: [DatabaseService, GeocodingService],
  bootstrap: [AppComponent]
})
export class AppModule { }
