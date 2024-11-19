import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  countyMapData!: { id: number; name: string; info: string }; // Data sent to sidebar
  sidebarData!: { selectedCounty: string; details: string }; // Data sent to county map

  // Handle data from the county map
  onCountyMapDataReceived(data: { id: number; name: string; info: string }) {
    this.countyMapData = data;
  }

  // Handle data from the sidebar
  onSidebarDataReceived(data: { selectedCounty: string; details: string }) {
    this.sidebarData = data;
  }

  // zoomScale = 1

  // handleZoomData(data: string) {
  //   this.zoomScale = Number(data)
  // }


}
