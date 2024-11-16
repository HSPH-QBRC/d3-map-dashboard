import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { MapsComponent } from './maps/maps.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {MatSelectModule} from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatCardModule} from '@angular/material/card';
import { StateMapsComponent } from './state-maps/state-maps.component';
import {MatIconModule} from '@angular/material/icon';
import { TilesMapComponent } from './tiles-map/tiles-map.component';
import { TileTestComponent } from './tile-test/tile-test.component';
import { TileTestOnlyComponent } from './tile-test-only/tile-test-only.component';
import { CountyMapComponent } from './county-map/county-map.component';
import { LeafletTestComponent } from './leaflet-test/leaflet-test.component';

@NgModule({
  declarations: [
    AppComponent,
    MapsComponent,
    LoadingSpinnerComponent,
    StateMapsComponent,
    TilesMapComponent,
    TileTestComponent,
    TileTestOnlyComponent,
    CountyMapComponent,
    LeafletTestComponent
  ],
  imports: [
    BrowserModule,
    NoopAnimationsModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    BrowserAnimationsModule,
    MatCardModule,
    MatIconModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
