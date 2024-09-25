import { Component, AfterViewInit } from '@angular/core';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { FormControl } from '@angular/forms';
import fipsToStateJson from '../../assets/data/fipsToState.json'
import fipsToCountyJson from '../../assets/data/fipsToCounty.json';
import { tile as d3Tile } from 'd3-tile';

interface GroceryData {
  id: string;
  rate: number;
}

@Component({
  selector: 'app-tiles-map',
  templateUrl: './tiles-map.component.html',
  styleUrls: ['./tiles-map.component.scss']
})
export class TilesMapComponent implements AfterViewInit {

  private data1: GroceryData[] = [];
  private data2: GroceryData[] = [];
  private data3: GroceryData[] = [];
  private us: any;
  private state: any;
  private nj: any;


  constructor() { }

  isLoading: boolean = true

  min1: number = 10000000000;
  max1: number = 0;
  min2: number = 10000000000;
  max2: number = 0;
  min3: number = 10000000000;
  max3: number = 0;
  selectedYear: string = '2017';
  yearCols = []
  columns = []

  statesArr = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana',
    'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massacheusetts', "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"]
  selectedCol1: string = 'population';
  // selectedCol2: string = '--';
  selectedCol2: string = 'count_sales_445110';
  selectedCol3: string = '--';
  selectedState = 'Massacheusetts'
  columnVal1 = new FormControl(this.selectedCol1);
  columnVal2 = new FormControl(this.selectedCol2);
  columnVal3 = new FormControl(this.selectedCol3);
  statesVal = new FormControl(this.selectedState);
  yearVal = new FormControl(this.selectedYear);

  data2Obj = {}
  data3Obj = {}

  useBivariate: boolean = true

  ngAfterViewInit() {
    this.getData()
  }

  fipsToState = fipsToStateJson
  fipsToCounty = fipsToCountyJson

  statesFileDict = {
    "Alabama": "cb_2017_01_tract_500k.json",
    "Alaska": "cb_2017_02_tract_500k.json",
    "Arizona": "cb_2017_04_tract_500k.json",
    "Arkansas": "cb_2017_05_tract_500k.json",
    "California": "cb_2017_06_tract_500k.json",
    "Colorado": "cb_2017_08_tract_500k.json",
    "Connecticut": "cb_2017_09_tract_500k.json",
    "Delaware": "cb_2017_10_tract_500k.json",
    "District of Columbia": "cb_2017_11_tract_500k.json",
    "Florida": "cb_2017_12_tract_500k.json",
    "Georgia": "cb_2017_13_tract_500k.json",
    "Hawaii": "cb_2017_15_tract_500k.json",
    "Idaho": "cb_2017_16_tract_500k.json",
    "Illinois": "cb_2017_17_tract_500k.json",
    "Indiana": "cb_2017_18_tract_500k.json",
    "Iowa": "cb_2017_19_tract_500k.json",
    "Kansas": "cb_2017_20_tract_500k.json",
    "Kentucky": "cb_2017_21_tract_500k.json",
    "Louisiana": "cb_2017_22_tract_500k.json",
    "Maine": "cb_2017_23_tract_500k.json",
    "Maryland": "cb_2017_24_tract_500k.json",
    "Massacheusetts": "cb_2017_25_tract_500k.json",
    "Michigan": "cb_2017_26_tract_500k.json",
    "Minnesota": "cb_2017_27_tract_500k.json",
    "Mississippi": "cb_2017_28_tract_500k.json",
    "Missouri": "cb_2017_29_tract_500k.json",
    "Montana": "cb_2017_30_tract_500k.json",
    "Nebraska": "cb_2017_31_tract_500k.json",
    "Nevada": "cb_2017_32_tract_500k.json",
    "New Hampshire": "cb_2017_33_tract_500k.json",
    "New Jersey": "cb_2017_34_tract_500k.json",
    "New Mexico": "cb_2017_35_tract_500k.json",
    "New York": "cb_2017_36_tract_500k.json",
    "North Carolina": "cb_2017_37_tract_500k.json",
    "North Dakota": "cb_2017_38_tract_500k.json",
    "Ohio": "cb_2017_39_tract_500k.json",
    "Oklahoma": "cb_2017_40_tract_500k.json",
    "Oregon": "cb_2017_41_tract_500k.json",
    "Pennsylvania": "cb_2017_42_tract_500k.json",
    "Rhode Island": "cb_2017_44_tract_500k.json",
    "South Carolina": "cb_2017_45_tract_500k.json",
    "South Dakota": "cb_2017_46_tract_500k.json",
    "Tennessee": "cb_2017_47_tract_500k.json",
    "Texas": "cb_2017_48_tract_500k.json",
    "Utah": "cb_2017_49_tract_500k.json",
    "Vermont": "cb_2017_50_tract_500k.json",
    "Virginia": "cb_2017_51_tract_500k.json",
    "Washington": "cb_2017_53_tract_500k.json",
    "West Virginia": "cb_2017_54_tract_500k.json",
    "Wisconsin": "cb_2017_55_tract_500k.json",
    "Wyoming": "cb_2017_56_tract_500k.json"

  }

  transformOriginX = 0; // X origin for zoom
  transformOriginY = 0; // Y origin for zoom
  mouseX = 975 / 2;
  mouseY = 600 / 2;

  async getData() {
    this.isLoading = true
    // Load data and TopoJSON files
    const csvData = await d3.csv('assets/nanda_grocery_tract_2003-2017_01P.csv');

    if (this.yearCols.length === 0) {
      for (const d of csvData) {
        if (!this.yearCols.includes(d['year'])) {
          this.yearCols.push(d['year'])
        }
      }
      this.yearCols.sort((a, b) => a - b);
    }

    for (const d of csvData) {
      if (d['year'] === this.selectedYear) {
        let rate1 = Math.log(Number(d[this.selectedCol1]) + 1);
        let rate2 = Math.log(Number(d[this.selectedCol2]) + 1);
        let rate3 = Math.log(Number(d[this.selectedCol3]) + 1);

        if (!isNaN(rate1) && rate1 !== null && rate1 !== undefined && rate1 !== -1 && rate1 !== -Infinity) {
          this.min1 = Math.min(this.min1, rate1)
          this.max1 = Math.max(this.max1, rate1)
          this.data1.push({
            id: d['tract_fips10'],
            rate: rate1
          } as GroceryData);
        }

        if (!isNaN(rate2) && rate2 !== null && rate2 !== undefined && rate2 !== -1 && rate2 !== -Infinity) {
          this.min2 = Math.min(this.min2, rate2)
          this.max2 = Math.max(this.max2, rate2)
          this.data2.push({
            id: d['tract_fips10'],
            rate: rate2
          } as GroceryData);

          let id = d['tract_fips10']
          this.data2Obj[id] = {
            rate: rate2
          }
        }

        if (!isNaN(rate3) && rate3 !== null && rate3 !== undefined && rate3 !== -1 && rate3 !== -Infinity) {
          this.min3 = Math.min(this.min3, rate3)
          this.max3 = Math.max(this.max3, rate3)
          this.data3.push({
            id: d['tract_fips10'],
            rate: rate3
          } as GroceryData);

          let id = d['tract_fips10']
          this.data3Obj[id] = {
            rate: rate3
          }
        }

      }


    }
    this.isLoading = false;

    this.columns = csvData.columns
    this.columns.push('--')
    this.columns.sort()

    // this.us = await d3.json('./assets/counties-albers-10m.json');
    this.state = await d3.json(`./assets/maps/${this.statesFileDict[this.selectedState]}`)
    // this.nj = await d3.json('./assets/nj-tracts.json')
    this.topoJsonObjectsKey = Object.keys(this.state.objects)[0]

    if (this.useBivariate) {
      this.createNJChart()
    } else {
      this.createChart();
    }
  }

  scatterplotContainerId = '#map'
  topoJsonObjectsKey = ''


  private createChart(): void {
    const tractName = this.topoJsonObjectsKey
    const width = 975;
    const height = 610;

    const color1 = d3.scaleSequential(d3.interpolateBlues).domain([this.min1, this.max1]);
    const path = d3.geoPath();

    const valuemap1 = new Map(this.data1.map(d => [d.id, d.rate]));
    const valuemap2 = new Map(this.data2.map(d => [d.id, d.rate]));
    const valuemap3 = new Map(this.data3.map(d => [d.id, d.rate]));

    d3.select(this.scatterplotContainerId)
      .selectAll('svg')
      .remove();

    const svg = d3.select(this.scatterplotContainerId)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", `max-width: 100%; height: auto; scale: ${this.zoomScale}; transform-origin: 0 0;`)

    const g = svg.append("g");
    const defs = svg.append("defs");

    defs.append("pattern")
      .attr("id", "diagonal-stripe")
      .attr("width", 4)
      .attr("height", 4)
      .attr("patternUnits", "userSpaceOnUse")
      .append("path")
      .attr("d", "M0,4 L4,0") // Diagonal stripe
      .attr("stroke", "red")  // Pattern color
      .attr("stroke-width", 1)
      .attr("opacity", 1)  // Set the opacity of the pattern

    defs.append("pattern")
      .attr("id", "crosshatch")
      .attr("width", 6)
      .attr("height", 6)
      .attr("patternUnits", "userSpaceOnUse")
      .append("path")
      .attr("d", "M0,0 L6,6 M6,0 L0,6")  // Diagonal lines
      .attr("stroke", "yellow")
      .attr("stroke-width", 1);

    d3.selectAll(".tooltip").transition().duration(200).style("opacity", 0)

    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("padding", "6px")
      .style("background", "#fff")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("box-shadow", "0px 0px 10px rgba(0,0,0,0.2)")
      .style("pointer-events", "none")
      .style("opacity", 0); // Initially hidden

    // Draw the counties with the color fill
    if (this.useBivariate === false) {
      if (this.selectedCol1 !== '--') {
        const land = topojson.feature(this.state, {
          type: "GeometryCollection",
          geometries: this.state.objects[tractName].geometries.filter((d) => (d.properties.geoid / 10000 | 0) % 100 !== 99)
        });

        // EPSG:32111
        const path = d3.geoPath()
          .projection(d3.geoTransverseMercator()
            // .rotate([90, 0])
            .rotate([74 + 30 / 60, -38 - 50 / 60])
            .fitExtent([[20, 20], [width - 20, height - 20]], land));

        svg.selectAll("path")
          .data(land.features)
          .enter().append("path")
          .attr("class", "tract")
          .attr("d", path)

        svg.append("path")
          .datum(topojson.mesh(this.state, this.state.objects[tractName], function (a, b) { return a !== b; }))
          .attr("class", "tract-border")
          .attr("d", path)

        svg.append("style").text(`
          .tract:hover {fill: orange }
          .tract-border {
            fill: none;
            stroke: rgba(119, 119, 119, .7);
            stroke-width: 1px;
            pointer-events: pointer;
          }
        `);
        const fipsToState = this.fipsToState
        const fipsToCounty = this.fipsToCounty
        const col1Name = this.selectedCol1.charAt(0).toUpperCase() + this.selectedCol1.slice(1).toLowerCase();
        const col2Name = this.selectedCol2.charAt(0).toUpperCase() + this.selectedCol2.slice(1).toLowerCase();
        const col3Name = this.selectedCol3.charAt(0).toUpperCase() + this.selectedCol3.slice(1).toLowerCase();
        svg.selectAll(".tract")
          .attr("class", "tract")
          .attr("fill", d => {
            const id = d['properties']['GEOID']
            const val1 = valuemap1.get(id)
            return color1(val1)
          })

          .on("mouseover", function (event, d) {
            const prop = d['properties']
            const val1String = valuemap1.get(prop['GEOID']) !== undefined ? valuemap1.get(prop['GEOID']).toFixed(5) : 'N/A'
            // const val2String = valuemap2.get(prop['GEOID']) !== undefined ? valuemap2.get(prop['GEOID']).toFixed(5) : 'N/A'
            d3.select(this).style("cursor", "pointer");  // Change cursor to pointer on hover
            tooltip.transition().duration(200).style("opacity", 1);  // Show tooltip
            const fipscode = prop.STATEFP + prop.COUNTYFP
            const countyName = `${fipsToCounty[fipscode]['County']}`
            tooltip.html(`State: ${fipsToState[prop.STATEFP]} (${prop.STATEFP})<br>County: ${countyName} (${fipscode})<br>Census Tract: ${prop.NAME}<br>${col1Name}: ${val1String}`)
              .style("left", (event.pageX + 10) + "px")  // Position tooltip
              .style("top", (event.pageY - 10) + "px");
          })
          .on("mouseout", function (event, d) {
            d3.select(this).style("cursor", "default");  // Change cursor back to default when not hovering
            tooltip.transition().duration(200).style("opacity", 0);  // Hide tooltip
          })
          .on("click", function (event, d) {
            tooltip.transition().duration(200).style("opacity", 0);
          })
          .attr("d", path)

        // Draw the pattern layer on top of the colored counties
        if (this.selectedCol2 !== '--') {
          svg.append("g")
            .selectAll("path")
            .data(topojson.feature(this.state, this.state.objects[tractName])['features'])
            .join("path")
            .attr("fill", "url(#diagonal-stripe)")  // Second layer: pattern fill with opacity
            .on("mouseover", function (event, d) {
              const prop = d['properties']
              const val1String = valuemap1.get(prop['GEOID']) !== undefined ? valuemap1.get(prop['GEOID']).toFixed(5) : 'N/A'
              const val2String = valuemap2.get(prop['GEOID']) !== undefined ? valuemap2.get(prop['GEOID']).toFixed(5) : 'N/A'
              d3.select(this).style("cursor", "pointer");  // Change cursor to pointer on hover
              tooltip.transition().duration(200).style("opacity", 1);  // Show tooltip
              const fipscode = prop.STATEFP + prop.COUNTYFP
              const countyName = `${fipsToCounty[fipscode]['County']}`
              tooltip.html(`State: ${fipsToState[prop.STATEFP]} (${prop.STATEFP})<br>County: ${countyName} (${fipscode})<br>Census Tract: ${prop.NAME}<br>${col1Name}: ${val1String}<br>${col2Name}: ${val2String}`)
                .style("left", (event.pageX + 10) + "px")  // Position tooltip
                .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function (event, d) {
              d3.select(this).style("cursor", "default");  // Change cursor back to default when not hovering
              tooltip.transition().duration(200).style("opacity", 0);  // Hide tooltip
            })
            .on("click", function (event, d) {
              tooltip.transition().duration(200).style("opacity", 0);
            })
            .attr("d", path)
            .attr("opacity", d => {
              const id = d['properties']['GEOID']
              const rate = this.data2Obj[id]['rate']
              if (id !== undefined && rate !== 0) {
                return rate / this.max2 + 0.2
              }
              return 0
            })
        }

        if (this.selectedCol3 !== '--') {
          svg.append("g")
            .selectAll("path")
            .data(topojson.feature(this.state, this.state.objects[tractName])['features'])
            .join("path")
            .attr("fill", "url(#crosshatch)")  // Second layer: polka dot pattern
            .on("mouseover", function (event, d) {
              const prop = d['properties']
              const val1String = valuemap1.get(prop['GEOID']) !== undefined ? valuemap1.get(prop['GEOID']).toFixed(5) : 'N/A'
              const val2String = valuemap2.get(prop['GEOID']) !== undefined ? valuemap2.get(prop['GEOID']).toFixed(5) : 'N/A'
              const val3String = valuemap3.get(prop['GEOID']) !== undefined ? valuemap3.get(prop['GEOID']).toFixed(5) : 'N/A'
              d3.select(this).style("cursor", "pointer");  // Change cursor to pointer on hover
              tooltip.transition().duration(200).style("opacity", 1);  // Show tooltip
              const fipscode = prop.STATEFP + prop.COUNTYFP
              const countyName = `${fipsToCounty[fipscode]['County']}`
              tooltip.html(`State: ${fipsToState[prop.STATEFP]} (${prop.STATEFP})<br>County: ${countyName} (${fipscode})<br>Census Tract: ${prop.NAME}<br>${col1Name}: ${val1String}<br>${col2Name}: ${val2String}<br>${col3Name}: ${val3String}`)
                .style("left", (event.pageX + 10) + "px")  // Position tooltip
                .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function (event, d) {
              d3.select(this).style("cursor", "default");  // Change cursor back to default when not hovering
              tooltip.transition().duration(200).style("opacity", 0);  // Hide tooltip
            })
            .on("click", function (event, d) {
              tooltip.transition().duration(200).style("opacity", 0);
            })
            .attr("d", path)
            .attr("opacity", d => {
              const id = d['properties']['GEOID']
              const rate = this.data3Obj[id]['rate']
              if (id !== undefined && rate !== 0) {
                return rate / this.max3 + 0.2
              }
              return 0
            })
        }
      }
    } else {
      if (this.selectedCol1 !== '--' && this.selectedCol2 !== '--') {
        let xRange1 = this.min1;
        let xRange2 = (this.max1 - this.min1) / 3 + this.min1
        let xRange3 = 2 * ((this.max1 - this.min1) / 3) + this.min1
        let xRange4 = this.max1

        let yRange1 = this.min2;
        let yRange2 = (this.max2 - this.min2) / 3 + this.min2
        let yRange3 = 2 * ((this.max2 - this.min2) / 3) + this.min2
        let yRange4 = this.max2

        g.append("g")
          .selectAll("path")
          .data(topojson.feature(this.state, this.state.objects[tractName])['features'])
          .join("path")
          .attr("fill", d => {
            if (valuemap1.get(d['id']) >= xRange1 && valuemap1.get(d['id']) < xRange2 && valuemap2.get(d['id']) >= yRange1 && valuemap2.get(d['id']) < yRange2) {
              return this.colors[0]
            } else if (valuemap1.get(d['id']) >= xRange2 && valuemap1.get(d['id']) < xRange3 && valuemap2.get(d['id']) >= yRange1 && valuemap2.get(d['id']) < yRange2) {
              return this.colors[1]
            } else if (valuemap1.get(d['id']) >= xRange3 && valuemap1.get(d['id']) <= xRange4 && valuemap2.get(d['id']) >= yRange1 && valuemap2.get(d['id']) < yRange2) {
              return this.colors[2]
            } else if (valuemap1.get(d['id']) >= xRange1 && valuemap1.get(d['id']) < xRange2 && valuemap2.get(d['id']) >= yRange2 && valuemap2.get(d['id']) < yRange3) {
              return this.colors[3]
            } else if (valuemap1.get(d['id']) >= xRange2 && valuemap1.get(d['id']) < xRange3 && valuemap2.get(d['id']) >= yRange2 && valuemap2.get(d['id']) < yRange3) {
              return this.colors[4]
            } else if (valuemap1.get(d['id']) >= xRange3 && valuemap1.get(d['id']) <= xRange4 && valuemap2.get(d['id']) >= yRange2 && valuemap2.get(d['id']) < yRange3) {
              return this.colors[5]
            } else if (valuemap1.get(d['id']) >= xRange1 && valuemap1.get(d['id']) < xRange2 && valuemap2.get(d['id']) >= yRange3 && valuemap2.get(d['id']) <= yRange4) {
              return this.colors[6]
            } else if (valuemap1.get(d['id']) >= xRange2 && valuemap1.get(d['id']) < xRange3 && valuemap2.get(d['id']) >= yRange3 && valuemap2.get(d['id']) <= yRange4) {
              return this.colors[7]
            } else if (valuemap1.get(d['id']) >= xRange3 && valuemap1.get(d['id']) <= xRange4 && valuemap2.get(d['id']) >= yRange3 && valuemap2.get(d['id']) <= yRange4) {
              return this.colors[8]
            }

          })  // First layer: color fill
          .on("mouseover", function (event, d) {
            d3.select(this).style("cursor", "pointer");  // Change cursor to pointer on hover
          })
          .on("mouseout", function (event, d) {
            d3.select(this).style("cursor", "default");  // Change cursor back to default when not hovering
          })
          .on("click", function (event, d) {
            tooltip.transition().duration(200).style("opacity", 0);
          })
          .attr("d", path)
        // .append("title")
        // .text(d => `${d['properties'].name}, ${statemap.get(d['id'].slice(0, 2))['properties'].name}\n${this.selectedCol1.charAt(0).toUpperCase() + this.selectedCol1.slice(1)}: ${valuemap1.get(d['id'])?.toFixed(5)}\n${this.selectedCol1.charAt(0).toUpperCase() + this.selectedCol2.slice(1)}: ${valuemap2.get(d['id'])?.toFixed(5)}`);

        // Create the grid for the legend
        const k = 24; // size of each cell in the grid
        const n = 3 // Grid size for the legend
        // const arrowId = 'arrowMarker';  // Unique ID for the arrow marker
        const legendGroup = g.append('g')
          .attr('font-family', 'sans-serif')
          .attr('font-size', 10)
          .attr('transform', `translate(${width - 100}, ${height - 175}) rotate(-45 ${k * n / 2},${k * n / 2})`);

        // Add the squares to the legend
        d3.cross(d3.range(n), d3.range(n)).forEach(([i, j]) => {
          legendGroup.append('rect')
            .attr('width', k)
            .attr('height', k)
            .attr('x', i * k)
            .attr('y', (n - 1 - j) * k)
            .attr('fill', this.colors[j * n + i])
        });

        // Add diagonal lines with arrows
        svg.append('defs')
          .append('marker')
          .attr('id', 'arrowMarker')
          .attr('viewBox', '0 0 10 10')
          .attr('refX', 5)
          .attr('refY', 5)
          .attr('markerWidth', 7)
          .attr('markerHeight', 7)
          .attr('orient', 'auto')
          .append('path')
          .attr('d', 'M0,0 L10,5 L0,10 Z')  // Triangle path for the arrow
          .attr('fill', 'black');

        legendGroup.append('line')
          .attr('marker-end', `url(#arrowMarker)`)
          .attr('x1', 0)
          .attr('x2', n * k)
          .attr('y1', n * k)
          .attr('y2', n * k)
          .attr('stroke', 'black')
          .attr('stroke-width', 1.75);

        legendGroup.append('line')
          .attr('marker-end', `url(#arrowMarker)`)
          .attr('y2', 0)
          .attr('y1', n * k)
          .attr('stroke', 'black')
          .attr('stroke-width', 1.75);

        // Add labels to the axes
        legendGroup.append('text')
          .attr('font-weight', 'bold')
          .attr('dy', '0.71em')
          .attr('transform', `rotate(90) translate(${n / 2 * k}, 6)`)
          .attr('text-anchor', 'middle')
          .text(`${this.selectedCol2.charAt(0).toUpperCase() + this.selectedCol2.slice(1)}`);

        legendGroup.append('text')
          .attr('font-weight', 'bold')
          .attr('dy', '0.71em')
          .attr('transform', `translate(${n / 2 * k}, ${n * k + 6})`)
          .attr('text-anchor', 'middle')
          .text(`${this.selectedCol1.charAt(0).toUpperCase() + this.selectedCol1.slice(1)}`);
      }
    }


    svg.append("path")
      .datum(topojson.mesh(this.state, this.state.objects[this.topoJsonObjectsKey], (a, b) => a !== b))
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-linejoin", "round")
      .attr("d", path);
  }

  colors = [
    "#e8e8e8", "#ace4e4", "#5ac8c8",
    "#dfb0d6", "#a5add3", "#5698b9",
    "#be64ac", "#8c62aa", "#3b4994"
  ]

  onSelectionChange(event, column): void {
    if (column === 'column1') {
      this.selectedCol1 = event.value;
    } else if (column === 'column2') {
      this.selectedCol2 = event.value;
    } else if (column === 'column3') {
      this.selectedCol3 = event.value;
    } else if (column === 'year') {
      this.selectedYear = event.value;
    } else if (column === 'states') {
      this.selectedState = event.value
    }

    this.resetVariables()
    this.getData()


  }

  onChangeBivariate(event) {
    this.useBivariate = event.checked;

    this.resetVariables()
    this.getData()
  }

  resetVariables() {
    this.min1 = 10000000000;
    this.max1 = 0;
    this.min2 = 10000000000;
    this.max2 = 0;
    this.min3 = 10000000000;
    this.max3 = 0;

    this.zoomScale = 1;
  }

  createNJChart() {
    const tractName = this.topoJsonObjectsKey
    const width = 975;
    const height = 610;
    const valuemap1 = new Map(this.data1.map(d => [d.id, d.rate]));
    const valuemap2 = new Map(this.data2.map(d => [d.id, d.rate]));

    let xRange1 = this.min1;
    let xRange2 = (this.max1 - this.min1) / 3 + this.min1
    let xRange3 = 2 * ((this.max1 - this.min1) / 3) + this.min1
    let xRange4 = this.max1

    let yRange1 = this.min2;
    let yRange2 = (this.max2 - this.min2) / 3 + this.min2
    let yRange3 = 2 * ((this.max2 - this.min2) / 3) + this.min2
    let yRange4 = this.max2

    d3.selectAll(".tooltip").transition().duration(200).style("opacity", 0)

    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("padding", "6px")
      .style("background", "#fff")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("box-shadow", "0px 0px 10px rgba(0,0,0,0.2)")
      .style("pointer-events", "none")
      .style("opacity", 0); // Initially hidden



    d3.select(this.scatterplotContainerId)
      .selectAll('svg')
      .remove();

    const svg = d3.select(this.scatterplotContainerId)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      // .attr("style", `max-width: 100%; height: auto; scale: ${this.zoomScale}; translate(${this.newX}px, ${this.newY}px); transform-origin: 0 0;`) //scale is how you control the zoom
      .attr("style", `max-width: 100%; height: auto; transform-origin: 0 0;`)

    const land = topojson.feature(this.state, {
      type: "GeometryCollection",
      geometries: this.state.objects[tractName].geometries.filter((d) => (d.properties.geoid / 10000 | 0) % 100 !== 99)
    });

    svg.append("style").text(`
      .tract:hover {fill: orange }
      .tract-border {
        fill: none;
        stroke: rgba(119, 119, 119, .7);
        stroke-width: 1px;
        pointer-events: pointer;
      }
    `);
    const fipsToState = this.fipsToState
    const fipsToCounty = this.fipsToCounty
    const col1Name = this.selectedCol1.charAt(0).toUpperCase() + this.selectedCol1.slice(1).toLowerCase();
    const col2Name = this.selectedCol2.charAt(0).toUpperCase() + this.selectedCol2.slice(1).toLowerCase();

    // Number of tiles in the x and y directions
    const tileWidth = width; // or adjust based on your map size
    const tileHeight = height; // or adjust based on your map size

    // // Calculate number of tiles needed in both dimensions
    const numTilesX = Math.ceil(width / tileWidth);
    const numTilesY = Math.ceil(height / tileHeight);

    // Function to render a specific tile
    const renderTile = (tileX, tileY) => {
      // Define the boundaries of the current tile
      const tileMinX = tileX * tileWidth;
      const tileMinY = tileY * tileHeight;
      const tileMaxX = tileMinX + tileWidth;
      const tileMaxY = tileMinY + tileHeight;

      // Create a new projection for each tile
      const tileProjection = d3.geoTransverseMercator()
        .rotate([74 + 30 / 60, -38 - 50 / 60])
        .fitExtent([[tileMinX, tileMinY], [tileMaxX, tileMaxY]], land); // Adjust projection for each tile

      // Create a new path generator for each tile using the tile-specific projection
      const tilePath = d3.geoPath().projection(tileProjection);

      // Append a group for the current tile
      const tileGroup = svg.append('g')
        .attr('class', `tile-${tileX}-${tileY}`)
        .attr('transform', `translate(${tileMinX}, ${tileMinY})`)

      // Add the part of the map corresponding to this tile
      tileGroup.selectAll('path')
        .data(land.features)
        .enter().append('path')
        .attr('d', tilePath)
        .attr("class", "tract")
        .attr("fill", d => {
          const id = d['properties']['GEOID'];
          const val1 = valuemap1.get(id);
          const val2 = valuemap2.get(id);
          if (val1 >= xRange1 && val1 < xRange2 && val2 >= yRange1 && val2 < yRange2) {
            return this.colors[0];
          } else if (val1 >= xRange2 && val1 < xRange3 && val2 >= yRange1 && val2 < yRange2) {
            return this.colors[1];
          } else if (val1 >= xRange3 && val1 <= xRange4 && val2 >= yRange1 && val2 < yRange2) {
            return this.colors[2];
          } else if (val1 >= xRange1 && val1 < xRange2 && val2 >= yRange2 && val2 < yRange3) {
            return this.colors[3];
          } else if (val1 >= xRange2 && val1 < xRange3 && val2 >= yRange2 && val2 < yRange3) {
            return this.colors[4];
          } else if (val1 >= xRange3 && val1 <= xRange4 && val2 >= yRange2 && val2 < yRange3) {
            return this.colors[5];
          } else if (val1 >= xRange1 && val1 < xRange2 && val2 >= yRange3 && val2 <= yRange4) {
            return this.colors[6];
          } else if (val1 >= xRange2 && val1 < xRange3 && val2 >= yRange3 && val2 <= yRange4) {
            return this.colors[7];
          } else if (val1 >= xRange3 && val1 <= xRange4 && val2 >= yRange3 && val2 <= yRange4) {
            return this.colors[8];
          } else {
            return "yellow";
          }
        })
        .on("mouseover", function (event, d) {
          const prop = d['properties'];
          const val1String = valuemap1.get(prop['GEOID']) !== undefined ? valuemap1.get(prop['GEOID']).toFixed(5) : 'N/A';
          const val2String = valuemap2.get(prop['GEOID']) !== undefined ? valuemap2.get(prop['GEOID']).toFixed(5) : 'N/A';
          d3.select(this).style("cursor", "pointer");  // Change cursor to pointer on hover
          tooltip.transition().duration(200).style("opacity", 1);  // Show tooltip
          const fipscode = prop.STATEFP + prop.COUNTYFP;
          const countyName = `${fipsToCounty[fipscode]['County']}`;
          tooltip.html(`State: ${fipsToState[prop.STATEFP]} (${prop.STATEFP})<br>County: ${countyName} (${fipscode})<br>Census Tract: ${prop.NAME}<br>${col1Name}: ${val1String}<br>${col2Name}: ${val2String}`)
            .style("left", (event.pageX + 10) + "px")  // Position tooltip
            .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function (event, d) {
          d3.select(this).style("cursor", "default");  // Change cursor back to default when not hovering
          tooltip.transition().duration(200).style("opacity", 0);  // Hide tooltip
        })
        .attr('stroke', 'rgba(119, 119, 119, .7)')
        .attr('stroke-width', .2);
    };

    // Loop over the tiles and render each one
    for (let x = 0; x < numTilesX; x++) {
      for (let y = 0; y < numTilesY; y++) {
        renderTile(x, y);
      }
    }

    // Set up zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([1, 100])
      .on('zoom', (event) => {
        svg.attr('transform', event.transform);
      });

    // Function to zoom into a specific point (x, y)
    const zoomTo = (x, y, scale) => {
      console.log("scalle: ", scale)
      svg.transition()
        .duration(200)
        .call(zoom.transform, d3.zoomIdentity.translate(width / 2 - scale * x, height / 2 - scale * y).scale(scale));
    };

    svg.call(zoom)
      .on("wheel.zoom", null)     // Disable zooming with the mouse wheel
      .on("mousedown.zoom", null) // Disable zooming by dragging
      .on("dblclick.zoom", null); // Disable zooming by double-clicking

    // Call zoomTo() immediately after creating the SVG
    zoomTo(this.mouseX, this.mouseY, this.zoomScale);

    const largeStates = ['California', 'Florida', 'Georgia', 'Illinois', 'New York', 'North Carolina', 'Pennsylvania', 'Texas']
    // let currZoomScale = this.zoomScale

    svg.on('click', (event) => {
      const [mouseX, mouseY] = d3.pointer(event);
      this.mouseX = mouseX
      this.mouseY = mouseY

      if (largeStates.includes(this.selectedState)) {
        this.zoomScale = this.zoomScale < 5 ? 20 + this.zoomScale : this.zoomScale + 1
      } else {
        this.zoomScale = this.zoomScale < 5 ? 6 + this.zoomScale : this.zoomScale + 1
      }

      zoomTo(mouseX, mouseY, this.zoomScale);
    });

    // Create the grid for the legend
    const k = 24; // size of each cell in the grid 
    const n = 3 // Grid size for the legend
    const legendGroup = svg.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('transform', `translate(${width - 100 * this.zoomScale}, ${height - 175 * this.zoomScale}) rotate(-45 ${k * n / 2},${k * n / 2}) scale(${this.zoomScale / 2})`);

    // Add the squares to the legend
    d3.cross(d3.range(n), d3.range(n)).forEach(([i, j]) => {
      legendGroup.append('rect')
        .attr('width', k)
        .attr('height', k)
        .attr('x', i * k)
        .attr('y', (n - 1 - j) * k)
        .attr('fill', this.colors[j * n + i])
    });

    // Add diagonal lines with arrows
    svg.append('defs')
      .append('marker')
      .attr('id', 'arrowMarker')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 5)
      .attr('refY', 5)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L10,5 L0,10 Z')  // Triangle path for the arrow
      .attr('fill', 'black');

    legendGroup.append('line')
      .attr('marker-end', `url(#arrowMarker)`)
      .attr('x1', 0)
      .attr('x2', n * k)
      .attr('y1', n * k)
      .attr('y2', n * k)
      .attr('stroke', 'black')
      .attr('stroke-width', 1.75);

    legendGroup.append('line')
      .attr('marker-end', `url(#arrowMarker)`)
      .attr('y2', 0)
      .attr('y1', n * k)
      .attr('stroke', 'black')
      .attr('stroke-width', 1.75);

    // Add labels to the axes
    legendGroup.append('text')
      .attr('font-weight', 'bold')
      .attr('dy', '0.71em')
      .attr('transform', `rotate(90) translate(${n / 2 * k}, 6)`)
      .attr('text-anchor', 'middle')
      .text(`${this.selectedCol2.charAt(0).toUpperCase() + this.selectedCol2.slice(1)}`);

    legendGroup.append('text')
      .attr('font-weight', 'bold')
      .attr('dy', '0.71em')
      .attr('transform', `translate(${n / 2 * k}, ${n * k + 6})`)
      .attr('text-anchor', 'middle')
      .text(`${this.selectedCol1.charAt(0).toUpperCase() + this.selectedCol1.slice(1)}`);


  }
  zoomScale = 1

  applyZoom(direction) {
    // d3.select('.tooltip').style('opacity', 0);

    if (direction === '+' && this.zoomScale < 30) {
      this.zoomScale++
    } else if (direction === '-' && this.zoomScale !== 1) {
      this.zoomScale--
    }
    if (this.useBivariate) {
      this.createNJChart()
    } else {
      this.createChart()
    }

    console.log("zoom scale: ", this.zoomScale)
  }

  preventHistoryNavigation(event: WheelEvent): void {
    const container = event.currentTarget as HTMLElement;

    // Get the maximum horizontal scroll position
    const maxScrollLeft = container.scrollWidth - container.clientWidth;

    // Check if we're at the extreme left or right of the scrollable area
    if ((container.scrollLeft === 0 && event.deltaX < 0) ||
      (container.scrollLeft >= maxScrollLeft && event.deltaX > 0)) {
      // Prevent history navigation if scrolling at the extremes
      event.preventDefault();
    }
  }

}