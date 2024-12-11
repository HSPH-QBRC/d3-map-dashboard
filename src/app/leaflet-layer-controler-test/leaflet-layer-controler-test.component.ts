import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-leaflet-layer-controler-test',
  templateUrl: './leaflet-layer-controler-test.component.html',
  styleUrls: ['./leaflet-layer-controler-test.component.scss']
})
export class LeafletLayerControlerTestComponent implements AfterViewInit {
  private map: L.Map | undefined;

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) {
      console.error('Map container element not found!');
      return;
    }

    // Initialize map
    this.map = L.map(mapContainer).setView([39.75, -105.09], 12); // Coordinates near Denver

    // Define tile layers
    const openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    const openTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)'
    });

    // Define markers with popups
    const crownHill = L.marker([39.75, -105.09]).bindPopup('This is Crown Hill Park.');
    const rubyHill = L.marker([39.68, -105.00]).bindPopup('This is Ruby Hill Park.');

    // Create a layer group for parks
    const parks = L.layerGroup([crownHill, rubyHill]);

    // Add the default layer (OpenStreetMap)
    openStreetMap.addTo(this.map);

    // Define layer control
    const baseLayers = {
      'OpenStreetMap': openStreetMap,
      'OpenTopoMap': openStreetMap
    };

    const overlays = {
      'Parks': parks
    };

    L.control.layers(baseLayers, overlays).addTo(this.map);

    // Optionally add the parks layer by default
    parks.addTo(this.map);
  }
}

