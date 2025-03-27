import { Component, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { LeafletMapLambdaApiComponent } from './leaflet-map-lambda-api/leaflet-map-lambda-api.component'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
  @Output() dataToSidebar = new EventEmitter<{ years: string[], columns: string[], selectedYear: string, selectedCol: string[], useBivariate: boolean, stateName: string[], colorScheme: string, dataDictionary }>();
  @Output() downloadImageEmitter = new EventEmitter<any>();
  dataFromSidebar: any;
  dataFromSidebarStateNameOnly: any;
  @ViewChild(LeafletMapLambdaApiComponent) leafletMap!: LeafletMapLambdaApiComponent;


  showYears = true

  sidebarData = {
    "years": [],
    "columns": [],
    "selectedYear": '',
    "selectedCol": [],
    "useBivariate": false,
    "stateName": [],
    "colorScheme": '',
    "dataDictionary": {}
  };

  onCountyMapDataReceived(data) {
    this.sidebarData = data
    this.dataToSidebar.emit(this.sidebarData);
  }

  onSidebarDataReceived(data: any) {
    this.dataFromSidebar = data;
  }

  onSidebarDataReceivedStateNameOnly(data: any) {
    this.dataFromSidebarStateNameOnly = data;
  }

}
