import { Component, AfterViewInit } from '@angular/core';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { FormControl } from '@angular/forms';

interface GroceryData {
  id: string;
  rate: number;
}

@Component({
  selector: 'app-maps',
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.scss']
})

export class MapsComponent implements AfterViewInit {

  private data1: GroceryData[] = [];
  private data2: GroceryData[] = [];
  private data3: GroceryData[] = [];

  private us: any;

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
  selectedCol2: string = 'count_emp_445110';
  // selectedCol3: string = 'aden_emp_445110';
  selectedCol3: string = '--';
  columnVal1 = new FormControl(this.selectedCol1);
  columnVal2 = new FormControl(this.selectedCol2);
  columnVal3 = new FormControl(this.selectedCol3);
  yearVal = new FormControl(this.selectedYear);

  data2Obj = {}
  data3Obj = {}

  zoomedState = false;
  zoomedId = '';

  useBivariate: boolean = true

  avgData1 = {}
  avgData2 = {}

  ngAfterViewInit() {
    this.getData()
  }

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
            id: d['tract_fips10'].substring(0, 5),  // Taking the first 5 characters
            rate: rate1
          } as GroceryData);
        }

        if (!isNaN(rate2) && rate2 !== null && rate2 !== undefined && rate2 !== -1 && rate2 !== -Infinity) {
          this.min2 = Math.min(this.min2, rate2)
          this.max2 = Math.max(this.max2, rate2)
          this.data2.push({
            id: d['tract_fips10'].substring(0, 5),  // Taking the first 5 characters
            rate: rate2
          } as GroceryData);

          let id = d['tract_fips10'].substring(0, 5)
          this.data2Obj[id] = {
            rate: rate2
          }
        }

        if (!isNaN(rate3) && rate3 !== null && rate3 !== undefined && rate3 !== -1 && rate3 !== -Infinity) {
          this.min3 = Math.min(this.min3, rate3)
          this.max3 = Math.max(this.max3, rate3)
          this.data3.push({
            id: d['tract_fips10'].substring(0, 5),  // Taking the first 5 characters
            rate: rate3
          } as GroceryData);

          let id = d['tract_fips10'].substring(0, 5)
          this.data3Obj[id] = {
            rate: rate3
          }
        }
        this.isLoading = false;

      }

    }

    for (let i of this.data1) {
      let id = i['id']
      let rate = i['rate']

      if (!this.avgData1[id]) {
        this.avgData1[id] = {
          rateArr: []
        }
      }
      this.avgData1[id].rateArr.push(rate)
    }

    for (let i in this.avgData1) {
      if(this.avgData1[i]['rateArr'].length !== 0){
        this.avgData1[i]['avg'] = this.avgData1[i]['rateArr'].reduce((accumulator, currentValue) => accumulator + currentValue, 0) / this.avgData1[i]['rateArr'].length
      }else{
        this.avgData1[i]['avg'] = 0
      }
      
    }


    for (let i of this.data2) {
      let id = i['id']
      let rate = i['rate']

      if (!this.avgData2[id]) {
        this.avgData2[id] = {
          rateArr: []
        }
      }
      this.avgData2[id].rateArr.push(rate)
    }

    for (let i in this.avgData2) {
      if(this.avgData2[i]['rateArr'].length !== 0){
        this.avgData2[i]['avg'] = this.avgData2[i]['rateArr'].reduce((accumulator, currentValue) => accumulator + currentValue, 0) / this.avgData2[i]['rateArr'].length
      }else{
        this.avgData2[i]['avg'] = 0
      }
      
    }



    this.columns = csvData.columns
    this.columns.push('--')
    this.columns.sort()

    this.us = await d3.json('./assets/counties-albers-10m.json');
    const mass = await d3.json('./assets/cb_2023_25_tract_500k.json')
    this.createChart();
  }

  scatterplotContainerId = '#map'


  private createChart(): void {
    const width = 975;
    const height = 610;

    const zoomed = (event) => {
      const { transform } = event;
      svg.attr("transform", transform);
      svg.attr("stroke-width", 1 / transform.k);
    }

    const reset = () => {
      // g.transition().style("fill", null);
      g.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity,
        d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
      );

      this.zoomedState = false;
      this.zoomedId = '';
    }

    const clicked = (event, d) => {

      if (this.zoomedState && this.zoomedId === d.id) {
        reset();
      } else {
        this.zoomedState = true;
        this.zoomedId = d.id;
        const [[x0, y0], [x1, y1]] = path.bounds(d);
        event.stopPropagation();
        g.transition().style("fill", null); //this should select state instead of county
        // d3.select(this).transition().style("fill", "red")
        d3.select(event.currentTarget).transition().duration(750).call(
          zoom.transform,
          d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(8)
            .translate(-(x0 + x1) / 2 + width / 2 - (x1 - x0), -(y0 + y1) / 2 + height / 2 - (y1 - y0)),
          d3.pointer(event, svg.node())

        );
      }

    }
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", zoomed);

    const color1 = d3.scaleSequential(d3.interpolateBlues).domain([-this.max1 / 10, this.max1]);
    const path = d3.geoPath();

    const valuemap1 = new Map(this.data1.map(d => [d.id, d.rate]));
    const valuemap2 = new Map(this.data2.map(d => [d.id, d.rate]));
    const valuemap3 = new Map(this.data3.map(d => [d.id, d.rate]));

    const counties = topojson.feature(this.us, this.us.objects.counties);
    const states = topojson.feature(this.us, this.us.objects.states);
    // const states = topojson.feature(this.us, this.us.objects.cb_2023_25_tract_500k)

    const statemap = new Map(states['features'].map(d => [d.id, d]));

    const statemesh = topojson.mesh(this.us, this.us.objects.states, (a, b) => a !== b);

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
          .data(topojson.feature(this.us, this.us.objects.counties)['features'])
          .join("path")
          .attr("fill", d => color1(valuemap1.get(d['id'])))  // First layer: color fill
          .on("click", clicked)
          .on("mouseover", function (event, d) {
            d3.select(this).style("cursor", "pointer");  // Change cursor to pointer on hover
          })
          .on("mouseout", function (event, d) {
            d3.select(this).style("cursor", "default");  // Change cursor back to default when not hovering
          })
          .attr("d", path)
          .append("title")
          .text(d => `${d['properties'].name}, ${statemap.get(d['id'].slice(0, 2))['properties'].name}\n${this.selectedCol1.charAt(0).toUpperCase() + this.selectedCol1.slice(1)}: ${valuemap1.get(d['id'])?.toFixed(5)}`);
      }

      // Draw the pattern layer on top of the colored counties
      if (this.selectedCol2 !== '--') {
        svg.append("g")
          .selectAll("path")
          .data(topojson.feature(this.us, this.us.objects.counties)['features'])
          .join("path")
          .attr("fill", "url(#diagonal-stripe)")  // Second layer: pattern fill with opacity
          .on("click", clicked)
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
          .append("title")
          .text(d => `${d['properties'].name}, ${statemap.get(d['id'].slice(0, 2))['properties'].name}\n${this.selectedCol2.charAt(0).toUpperCase() + this.selectedCol2.slice(1)}: ${valuemap2.get(d['id'])?.toFixed(5)}`);

      }

      if (this.selectedCol3 !== '--') {
        svg.append("g")
          .selectAll("path")
          .data(topojson.feature(this.us, this.us.objects.counties)['features'])
          .join("path")
          .attr("fill", "url(#crosshatch)")  // Second layer: polka dot pattern
          .on("click", clicked)
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
          .append("title")
          .text(d => `${d['properties'].name}, ${statemap.get(d['id'].slice(0, 2))['properties'].name}\n${this.selectedCol3.charAt(0).toUpperCase() + this.selectedCol3.slice(1)}: ${valuemap3.get(d['id'])?.toFixed(5)}`);

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

        console.log("xrange: ", xRange1, xRange2, xRange3, xRange4)
        console.log("yrange: ", yRange1, yRange2, yRange3, yRange4)
        g.append("g")
          .selectAll("path")
          .data(topojson.feature(this.us, this.us.objects.counties)['features'])
          .join("path")
          // .attr("fill", d => {
          //   if (valuemap1.get(d['id']) >= xRange1 && valuemap1.get(d['id']) < xRange2 && valuemap2.get(d['id']) >= yRange1 && valuemap2.get(d['id']) < yRange2) {
          //     return this.colors[0]
          //   } else if (valuemap1.get(d['id']) >= xRange2 && valuemap1.get(d['id']) < xRange3 && valuemap2.get(d['id']) >= yRange1 && valuemap2.get(d['id']) < yRange2) {
          //     return this.colors[1]
          //   } else if (valuemap1.get(d['id']) >= xRange3 && valuemap1.get(d['id']) <= xRange4 && valuemap2.get(d['id']) >= yRange1 && valuemap2.get(d['id']) < yRange2) {
          //     return this.colors[2]
          //   } else if (valuemap1.get(d['id']) >= xRange1 && valuemap1.get(d['id']) < xRange2 && valuemap2.get(d['id']) >= yRange2 && valuemap2.get(d['id']) < yRange3) {
          //     return this.colors[3]
          //   } else if (valuemap1.get(d['id']) >= xRange2 && valuemap1.get(d['id']) < xRange3 && valuemap2.get(d['id']) >= yRange2 && valuemap2.get(d['id']) < yRange3) {
          //     return this.colors[4]
          //   } else if (valuemap1.get(d['id']) >= xRange3 && valuemap1.get(d['id']) <= xRange4 && valuemap2.get(d['id']) >= yRange2 && valuemap2.get(d['id']) < yRange3) {
          //     return this.colors[5]
          //   } else if (valuemap1.get(d['id']) >= xRange1 && valuemap1.get(d['id']) < xRange2 && valuemap2.get(d['id']) >= yRange3 && valuemap2.get(d['id']) <= yRange4) {
          //     return this.colors[6]
          //   } else if (valuemap1.get(d['id']) >= xRange2 && valuemap1.get(d['id']) < xRange3 && valuemap2.get(d['id']) >= yRange3 && valuemap2.get(d['id']) <= yRange4) {
          //     return this.colors[7]
          //   } else if (valuemap1.get(d['id']) >= xRange3 && valuemap1.get(d['id']) <= xRange4 && valuemap2.get(d['id']) >= yRange3 && valuemap2.get(d['id']) <= yRange4) {
          //     return this.colors[8]
          //   }

          // })  // First layer: color fill
          // this.avgData1[d['id']]['avg]
          .attr("fill", d => {
            if (this.avgData1[d['id']]['avg'] >= xRange1 && this.avgData1[d['id']]['avg'] < xRange2 && this.avgData2[d['id']]['avg'] >= yRange1 && this.avgData2[d['id']]['avg'] < yRange2) {
              return this.colors[0]
            } else if (this.avgData1[d['id']]['avg'] >= xRange2 && this.avgData1[d['id']]['avg'] < xRange3 && this.avgData2[d['id']]['avg'] >= yRange1 && this.avgData2[d['id']]['avg'] < yRange2) {
              return this.colors[1]
            } else if (this.avgData1[d['id']]['avg'] >= xRange3 && this.avgData1[d['id']]['avg'] <= xRange4 && this.avgData2[d['id']]['avg'] >= yRange1 && this.avgData2[d['id']]['avg'] < yRange2) {
              return this.colors[2]
            } else if (this.avgData1[d['id']]['avg'] >= xRange1 && this.avgData1[d['id']]['avg'] < xRange2 && this.avgData2[d['id']]['avg'] >= yRange2 && this.avgData2[d['id']]['avg'] < yRange3) {
              return this.colors[3]
            } else if (this.avgData1[d['id']]['avg'] >= xRange2 && this.avgData1[d['id']]['avg'] < xRange3 && this.avgData2[d['id']]['avg'] >= yRange2 && this.avgData2[d['id']]['avg'] < yRange3) {
              return this.colors[4]
            } else if (this.avgData1[d['id']]['avg'] >= xRange3 && this.avgData1[d['id']]['avg'] <= xRange4 && this.avgData2[d['id']]['avg'] >= yRange2 && this.avgData2[d['id']]['avg'] < yRange3) {
              return this.colors[5]
            } else if (this.avgData1[d['id']]['avg'] >= xRange1 && this.avgData1[d['id']]['avg'] < xRange2 && this.avgData2[d['id']]['avg'] >= yRange3 && this.avgData2[d['id']]['avg'] <= yRange4) {
              return this.colors[6]
            } else if (this.avgData1[d['id']]['avg'] >= xRange2 && this.avgData1[d['id']]['avg'] < xRange3 && this.avgData2[d['id']]['avg'] >= yRange3 && this.avgData2[d['id']]['avg'] <= yRange4) {
              return this.colors[7]
            } else if (this.avgData1[d['id']]['avg'] >= xRange3 && this.avgData1[d['id']]['avg'] <= xRange4 && this.avgData2[d['id']]['avg'] >= yRange3 && this.avgData2[d['id']]['avg'] <= yRange4) {
              return this.colors[8]
            }

          })
          .on("click", clicked)
          .on("mouseover", function (event, d) {
            d3.select(this).style("cursor", "pointer");  // Change cursor to pointer on hover
          })
          .on("mouseout", function (event, d) {
            d3.select(this).style("cursor", "default");  // Change cursor back to default when not hovering
          })
          .attr("d", path)
          .append("title")
          .text(d => `${d['properties'].name}, ${statemap.get(d['id'].slice(0, 2))['properties'].name}\n${this.selectedCol1.charAt(0).toUpperCase() + this.selectedCol1.slice(1)}: ${this.avgData1[d['id']]['avg']?.toFixed(5)}\n${this.selectedCol2.charAt(0).toUpperCase() + this.selectedCol2.slice(1)}: ${this.avgData2[d['id']]['avg']?.toFixed(5)}`);

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
      .datum(topojson.mesh(this.us, this.us.objects.states, (a, b) => a !== b))
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
    
  }

  onChangeBivariate(event) {
    this.useBivariate = event.checked;
    this.resetVariables()
  }

  resetVariables() {
    this.min1 = 10000000000;
    this.max1 = 0;
    this.min2 = 10000000000;
    this.max2 = 0;
    this.min3 = 10000000000;
    this.max3 = 0;

    this.avgData1 = {}
    this.avgData2 = {}

    this.getData()
  }
}
