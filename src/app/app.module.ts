import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {MatSelectModule} from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import { CountyMapComponent } from './county-map/county-map.component';
import { LeafletTestComponent } from './leaflet-test/leaflet-test.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import {MatSliderModule} from '@angular/material/slider';
import {MatRadioModule} from '@angular/material/radio';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { LeafletMapComponent } from './leaflet-map/leaflet-map.component';
import { HttpClientModule } from '@angular/common/http';
import { LeafletLayerControlerTestComponent } from './leaflet-layer-controler-test/leaflet-layer-controler-test.component';

@NgModule({
  declarations: [
    AppComponent,
    LoadingSpinnerComponent,
    CountyMapComponent,
    LeafletTestComponent,
    SidebarComponent,
    LeafletMapComponent,
    LeafletLayerControlerTestComponent
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
    MatIconModule,
    FormsModule,
    MatCheckboxModule,
    MatButtonModule,
    MatExpansionModule,
    MatSliderModule,
    MatRadioModule,
    MatSnackBarModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
