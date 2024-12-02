import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
  @Output() dataToSidebar = new EventEmitter<{ years: string[], columns: string[], maps: string[], selectedYear: string, selectedMap: string, selectedCol: string[], useBivariate: boolean, showRedline: boolean }>();

  dataFromSidebar: any;

  showYears = true

  sidebarData = {
    "years": [],
    "columns": [],
    "maps": [],
    "selectedYear": '',
    "selectedMap": '',
    "selectedCol": [],
    useBivariate: false,
    showRedline: false,
  };

  onCountyMapDataReceived(data) {
    this.sidebarData = data
    this.dataToSidebar.emit(this.sidebarData);
  }

  onSidebarDataReceived(data: any) {
    this.dataFromSidebar = data;
  }

}
