import { Component, AfterViewInit } from '@angular/core';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { FormControl } from '@angular/forms';
import fipsToStateJson from '../../assets/data/fipsToState.json'
import fipsToCountyJson from '../../assets/data/fipsToCounty.json'

interface GroceryData {
  id: string;
  rate: number;
}
@Component({
  selector: 'app-state-maps',
  templateUrl: './state-maps.component.html',
  styleUrls: ['./state-maps.component.scss']
})
export class StateMapsComponent implements AfterViewInit {

  private data1: GroceryData[] = [];
  private data2: GroceryData[] = [];
  private data3: GroceryData[] = [];
  private us: any;
  private mass: any;
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
  selectedCol1: string = 'population';
  // selectedCol2: string = '--';
  selectedCol2: string = 'count_sales_445110';
  selectedCol3: string = '--';
  columnVal1 = new FormControl(this.selectedCol1);
  columnVal2 = new FormControl(this.selectedCol2);
  columnVal3 = new FormControl(this.selectedCol3);
  yearVal = new FormControl(this.selectedYear);

  data2Obj = {}
  data3Obj = {}

  useBivariate: boolean = true

  ngAfterViewInit() {
    this.getData()
  }

  fipsToState = fipsToStateJson
  fipsToCounty = fipsToCountyJson

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

        if (!isNaN(rate1) && rate1 !== null && rate1 !== undefined && rate1 !== -1) {
          this.min1 = Math.min(this.min1, rate1)
          this.max1 = Math.max(this.max1, rate1)
          this.data1.push({
            id: d['tract_fips10'],  // Taking the first 5 characters
            rate: rate1
          } as GroceryData);
        }

        if (!isNaN(rate2) && rate2 !== null && rate2 !== undefined && rate2 !== -1) {
          this.min2 = Math.min(this.min2, rate2)
          this.max2 = Math.max(this.max2, rate2)
          this.data2.push({
            id: d['tract_fips10'],  // Taking the first 5 characters
            rate: rate2
          } as GroceryData);

          let id = d['tract_fips10']
          this.data2Obj[id] = {
            rate: rate2
          }
        }

        if (!isNaN(rate3) && rate3 !== null && rate3 !== undefined && rate3 !== -1) {
          this.min3 = Math.min(this.min3, rate3)
          this.max3 = Math.max(this.max3, rate3)
          this.data3.push({
            id: d['tract_fips10'],  // Taking the first 5 characters
            rate: rate3
          } as GroceryData);

          let id = d['tract_fips10']
          this.data3Obj[id] = {
            rate: rate3
          }
        }
        this.isLoading = false;
      }

    }

    this.columns = csvData.columns
    this.columns.push('--')
    this.columns.sort()

    // this.us = await d3.json('./assets/counties-albers-10m.json');
    // this.mass = await d3.json('./assets/cb_2023_25_tract_500k.json')
    this.mass = await d3.json('./assets/maps/cb_2017_06_tract_500k.json')
    // this.nj = await d3.json('./assets/nj-tracts.json')
    this.topoJsonObjectsKey = Object.keys(this.mass.objects)[0]
    // this.createChart();
    this.createNJChart()
  }

  scatterplotContainerId = '#map'
  topoJsonObjectsKey = ''


  private createChart(): void {
    const width = 975;
    const height = 610;

    const color1 = d3.scaleSequential(d3.interpolateBlues).domain([-this.max1 / 10, this.max1]);
    const path = d3.geoPath();

    const valuemap1 = new Map(this.data1.map(d => [d.id, d.rate]));
    const valuemap2 = new Map(this.data2.map(d => [d.id, d.rate]));
    const valuemap3 = new Map(this.data3.map(d => [d.id, d.rate]));

    // const counties = topojson.feature(this.us, this.us.objects.counties);
    const states = topojson.feature(this.us, this.us.objects.states);
    // const states = topojson.feature(this.nj, this.nj.objects.tracts)

    const statemap = new Map(states['features'].map(d => [d.id, d]));

    // const statemesh = topojson.mesh(this.us, this.us.objects.states, (a, b) => a !== b);

    d3.select(this.scatterplotContainerId)
      .selectAll('svg')
      .remove();

    const svg = d3.select(this.scatterplotContainerId)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;")

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

    // Draw the counties with the color fill
    if (this.useBivariate === false) {
      if (this.selectedCol1 !== '--') {

        g.append("g")
          .selectAll("path")
          .data(topojson.feature(this.nj, this.nj.objects.tracts)['features'])
          .join("path")
          .attr("fill", d => color1(valuemap1.get(d['id'])))  // First layer: color fill
          .on("mouseover", function (event, d) {
            d3.select(this).style("cursor", "pointer");  // Change cursor to pointer on hover
          })
          .on("mouseout", function (event, d) {
            d3.select(this).style("cursor", "default");  // Change cursor back to default when not hovering
          })
          .attr("d", path)
        // .append("title")
        // .text(d => `${d['properties'].name}, ${statemap.get(d['id'].slice(0, 2))['properties'].name}\n${this.selectedCol1.charAt(0).toUpperCase() + this.selectedCol1.slice(1)}: ${valuemap1.get(d['id'])?.toFixed(5)}`);
      }

      // Draw the pattern layer on top of the colored counties
      if (this.selectedCol2 !== '--') {
        svg.append("g")
          .selectAll("path")
          .data(topojson.feature(this.nj, this.nj.objects.tracts)['features'])
          .join("path")
          .attr("fill", "url(#diagonal-stripe)")  // Second layer: pattern fill with opacity
          .on("mouseover", function (event, d) {
            d3.select(this).style("cursor", "pointer");  // Change cursor to pointer on hover
          })
          .on("mouseout", function (event, d) {
            d3.select(this).style("cursor", "default");  // Change cursor back to default when not hovering
          })
          .attr("d", path)
          .attr("opacity", d => {
            const id = d['id']
            const rate = this.data2Obj[id]['rate']

            if (id !== undefined && rate !== 0) {
              return rate / this.max2 + 0.2
            }
            return 0
          })
        // .append("title")
        // .text(d => `${d['properties'].name}, ${statemap.get(d['id'].slice(0, 2))['properties'].name}\n${this.selectedCol2.charAt(0).toUpperCase() + this.selectedCol2.slice(1)}: ${valuemap2.get(d['id'])?.toFixed(5)}`);

      }

      if (this.selectedCol3 !== '--') {
        svg.append("g")
          .selectAll("path")
          .data(topojson.feature(this.nj, this.nj.objects.tracts)['features'])
          .join("path")
          .attr("fill", "url(#crosshatch)")  // Second layer: polka dot pattern
          .on("mouseover", function (event, d) {
            d3.select(this).style("cursor", "pointer");  // Change cursor to pointer on hover
          })
          .on("mouseout", function (event, d) {
            d3.select(this).style("cursor", "default");  // Change cursor back to default when not hovering
          })
          .attr("d", path)
          .attr("opacity", d => {
            const id = d['id'];
            const rate = this.data3Obj[id]['rate'];

            if (id !== undefined && rate !== 0) {
              return rate / this.max3 + 0.2;  // Control opacity of the pattern
            }
            return 0;
          })
        // .append("title")
        // .text(d => `${d['properties'].name}, ${statemap.get(d['id'].slice(0, 2))['properties'].name}\n${this.selectedCol3.charAt(0).toUpperCase() + this.selectedCol3.slice(1)}: ${valuemap3.get(d['id'])?.toFixed(5)}`);

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
          .data(topojson.feature(this.nj, this.nj.objects.tracts)['features'])
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
      .datum(topojson.mesh(this.mass, this.mass.objects[this.topoJsonObjectsKey], (a, b) => a !== b))
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
  }

  createNJChart() {
    const scaleFactor = 1;
    const tractName = this.topoJsonObjectsKey
    const width = 975 * scaleFactor;
    const height = 610 * scaleFactor;
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

    const svg = d3.select(this.scatterplotContainerId)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; scale: 2") //scale is how you control the zoom

    const land = topojson.feature(this.mass, {
      type: "GeometryCollection",
      geometries: this.mass.objects[tractName].geometries.filter((d) => (d.properties.geoid / 10000 | 0) % 100 !== 99)
    });

    // EPSG:32111
    const path = d3.geoPath()
      .projection(d3.geoTransverseMercator()
        .rotate([74 + 30 / 60, -38 - 50 / 60])
        .fitExtent([[20, 20], [width - 20, height - 20]], land));

    svg.selectAll("path")
      .data(land.features)
      .enter().append("path")
      .attr("class", "tract")
      .attr("d", path)
    // .append("title")
    // .text(function (d) { return d.properties.geoid; });

    svg.append("path")
      .datum(topojson.mesh(this.mass, this.mass.objects[tractName], function (a, b) { return a !== b; }))
      .attr("class", "tract-border")
      .attr("d", path)

    svg.append("style").text(`
      .tract:hover {fill: orange }
      .tract-border {
        fill: none;
        stroke: rgba(119, 119, 119, .5);
        stroke-width: .1px;
        pointer-events: pointer;
      }
    `);
    const fipsToState = this.fipsToState
    const fipsToCounty = this.fipsToCounty
    const col1Name = this.selectedCol1.charAt(0).toUpperCase() + this.selectedCol1.slice(1).toLowerCase();
    const col2Name = this.selectedCol2.charAt(0).toUpperCase() + this.selectedCol2.slice(1).toLowerCase();
    svg.selectAll(".tract")
      .attr("class", "tract")
      .attr("fill", d => {
        const id = d['properties']['GEOID']
        const val1 = valuemap1.get(id)
        const val2 = valuemap2.get(id)
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
          return "white"
        }
      })
      .on("mouseover", function (event, d) {
        const prop = d['properties']
        const val1String = valuemap1.get(prop['GEOID']) !== undefined ? valuemap1.get(prop['GEOID']).toFixed(5) : 'N/A'
        const val2String = valuemap2.get(prop['GEOID']) !== undefined ? valuemap2.get(prop['GEOID']).toFixed(5) : 'N/A'
        console.log("prop: ", prop)
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
      .attr("d", path)

    // Create the grid for the legend
    const k = 24; // size of each cell in the grid
    const n = 3 // Grid size for the legend
    // const scaleFactor = 3
    const legendGroup = svg.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('transform', `translate(${width - 100*scaleFactor}, ${height - 175*scaleFactor}) rotate(-45 ${k * n / 2},${k * n / 2}) scale(${scaleFactor})`);

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
