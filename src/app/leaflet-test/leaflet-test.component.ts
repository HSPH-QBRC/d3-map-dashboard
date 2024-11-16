import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import * as d3 from 'd3';

@Component({
  selector: 'app-leaflet-test',
  templateUrl: './leaflet-test.component.html',
  styleUrls: ['./leaflet-test.component.scss']
})
export class LeafletTestComponent implements OnInit, AfterViewInit {

  map: L.Map;

  constructor() { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.initMap();
  }

  initMap(): void {
    // Initialize the Leaflet map
    this.map = L.map('map', {
      center: [42.3601, -71.0589], // Set the map center to Boston's coordinates
      zoom: 13 // Set the initial zoom level (you can adjust this based on preference)
    });

    // Add a base tile layer from OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

    // Create a D3.js overlay layer using Leaflet's SVG support
    const svgLayer = L.svg();
    svgLayer.addTo(this.map);

    // Access the SVG container created by Leaflet
    const svg = d3.select(this.map.getPanes().overlayPane).select('svg');
    const g = svg.append('g'); // Create a <g> element for D3.js

    // Add a circle to the map at a specified location
    g.append('circle')
      .attr('cx', this.map.latLngToLayerPoint([51.505, -0.09]).x)
      .attr('cy', this.map.latLngToLayerPoint([51.505, -0.09]).y)
      .attr('r', 10)
      .style('fill', 'red');
  }

}
