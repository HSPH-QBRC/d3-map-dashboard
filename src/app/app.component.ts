import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})


export class AppComponent {
  @Output() dataToSidebar = new EventEmitter<{ years: string[], columns: string[], maps: string[] }>();


  sidebarData = {
    "years": [],
    "columns": [],
    "maps": [],
    "selectedYear": '',
    "selectedMap": '',
    "selectedCol": []
  };


  onCountyMapDataReceived(data) {
    this.sidebarData = data
    this.dataToSidebar.emit(this.sidebarData);
  }

}
