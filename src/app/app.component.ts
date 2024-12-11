import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
  @Output() dataToSidebar = new EventEmitter<{ years: string[], columns: string[], selectedYear: string, selectedCol: string[], useBivariate: boolean, stateName: string}>();

  dataFromSidebar: any;
  dataFromSidebarStateNameOnly: any;

  showYears = true

  sidebarData = {
    "years": [],
    "columns": [],
    // "maps": [],
    "selectedYear": '',
    // "selectedMap": '',
    "selectedCol": [],
    useBivariate: false,
    "stateName": ''
    // showRedline: false,
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
