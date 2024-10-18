import { Component, AfterViewInit, EventEmitter, Output } from '@angular/core';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { FormControl } from '@angular/forms';
import fipsToStateJson from '../../assets/data/fipsToState.json'
import fipsToCountyJson from '../../assets/data/fipsToCounty.json';

interface GroceryData {
  id: string;
  rate: number;
}

@Component({
  selector: 'app-county-map',
  templateUrl: './county-map.component.html',
  styleUrls: ['./county-map.component.scss']
})
export class CountyMapComponent implements AfterViewInit {
  // @Output() zoomLevelEmitter: EventEmitter<string> = new EventEmitter<string>();
  private data1: GroceryData[] = [];
  private data2: GroceryData[] = [];
  private data3: GroceryData[] = [];
  private state: any;
  private stateTile = []
  private allStateTile = []

  constructor() { }

  scatterplotContainerId = '#map'
  topoJsonObjectsKey = ''

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

  statesArr = ['single tile', 'USA 2000 Mainland (County)', 'USA 2000 Mainland', 'USA 2018 Mainland', 'USA 2020 Mainland', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana',
    'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"]
  fullCountryArr = ['single tile', 'USA 2000 Mainland (County)', 'USA 2018 Mainland', 'USA 2020 Mainland', 'USA 2000 Mainland']
  selectedCol1: string = 'population';
  // selectedCol2: string = '--';
  selectedCol2: string = 'count_sales_445110';
  selectedCol3: string = '--';
  selectedState = 'USA 2000 Mainland (County)'
  // selectedState = 'USA 2018 Mainland'
  // selectedState = 'Massachusetts'
  columnVal1 = new FormControl(this.selectedCol1);
  columnVal2 = new FormControl(this.selectedCol2);
  columnVal3 = new FormControl(this.selectedCol3);
  statesVal = new FormControl(this.selectedState);
  yearVal = new FormControl(this.selectedYear);

  data2Obj = {}
  data3Obj = {}

  useBivariate: boolean = true

  minCol = 1000
  minRow = 100

  ngAfterViewInit() {
    this.getData()
  }

  fipsToState = fipsToStateJson
  fipsToCounty = fipsToCountyJson

  statesFileDict = {
    "single tile": "tiles/tile_id_15_5.json",
    "USA 2018 Mainland": "SVI_2018_US_tract_edit.json",
    "USA 2020 Mainland": "SVI2020_US_mainland_tract.json",
    "USA 2000 Mainland": "SVI2000_US_mainland_tract.json",
    "USA 2000 Mainland (County)": "SVI_2000_US_County.json",
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
    "Massachusetts": "cb_2017_25_tract_500k.json",
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

  stateCentroids = {
    "single tile": [0, 0],
    "Alabama": [-86.9023, 32.8067],
    "Alaska": [-152.4044, 61.3707],
    "Arizona": [-111.4312, 34.0489],
    "Arkansas": [-92.3731, 34.9697],
    "California": [-119.4179, 36.7783],
    "Colorado": [-105.3111, 39.1130],
    "Connecticut": [-72.7554, 41.5978],
    "Delaware": [-75.5071, 39.3185],
    "Florida": [-81.5158, 27.6648],
    "Georgia": [-82.9071, 32.1656],
    "Hawaii": [-155.5828, 19.8968],
    "Idaho": [-114.7420, 44.0682],
    "Illinois": [-89.3985, 40.6331],
    "Indiana": [-86.1349, 40.2672],
    "Iowa": [-93.0977, 41.8780],
    "Kansas": [-98.4842, 39.0119],
    "Kentucky": [-84.2700, 37.8393],
    "Louisiana": [-91.9623, 30.9843],
    "Maine": [-69.4455, 45.2538],
    "Maryland": [-76.6413, 39.0458],
    "Massachusetts": [-71.3824, 42.4072],
    "Michigan": [-85.6024, 44.3148],
    "Minnesota": [-94.6859, 46.7296],
    "Mississippi": [-89.3985, 32.3547],
    "Missouri": [-91.8318, 37.9643],
    "Montana": [-110.3626, 46.8797],
    "Nebraska": [-99.9018, 41.4925],
    "Nevada": [-116.4194, 38.8026],
    "New Hampshire": [-71.5724, 43.1939],
    "New Jersey": [-74.4057, 40.0583],
    "New Mexico": [-106.2485, 34.5199],
    "New York": [-75.0000, 43.0000],
    "North Carolina": [-79.0193, 35.7596],
    "North Dakota": [-101.0020, 47.5515],
    "Ohio": [-82.9071, 40.4173],
    "Oklahoma": [-97.5164, 35.0078],
    "Oregon": [-120.5542, 43.8041],
    "Pennsylvania": [-77.1945, 41.2033],
    "Rhode Island": [-71.4774, 41.5801],
    "South Carolina": [-81.1637, 33.8361],
    "South Dakota": [-99.9018, 43.9695],
    "Tennessee": [-86.5804, 35.5175],
    "Texas": [-99.9018, 31.9686],
    "Utah": [-111.0937, 39.3200],
    "Vermont": [-72.5778, 44.5588],
    "Virginia": [-78.6569, 37.4316],
    "Washington": [-120.7401, 47.7511],
    "West Virginia": [-80.4549, 38.5976],
    "Wisconsin": [-89.6165, 43.7844],
    "Wyoming": [-107.2903, 43.0750],
    "USA 2000 Mainland (County)": [-98.5795, 39.8283],
    "USA 2018 Mainland": [-98.5795, 39.8283],
    "USA 2020 Mainland": [-98.5795, 39.8283],
    "USA 2000 Mainland": [-98.5795, 39.8283]
  };
  transformOriginX = 0;
  transformOriginY = 0;
  mouseX = 700 / 2;
  mouseY = 600 / 2;

  avgData1 = {};
  avgData2 = {};

  zoomScale = 1;

  // tileArr = ['tile_id_15_7', 'tile_id_16_7', 'tile_id_17_7', 'tile_id_15_8', 'tile_id_16_8', 'tile_id_17_8']
  AllTilesArr = [
    'tile_id_11_5', 'tile_id_11_6', 'tile_id_11_7',
    'tile_id_12_5', 'tile_id_12_6', 'tile_id_12_7', 'tile_id_12_8',
    'tile_id_13_5', 'tile_id_13_6', 'tile_id_13_7', 'tile_id_13_8',
    'tile_id_14_5', 'tile_id_14_6', 'tile_id_14_7', 'tile_id_14_8',
    'tile_id_15_5', 'tile_id_15_6', 'tile_id_15_7', 'tile_id_15_8',
    'tile_id_16_5', 'tile_id_16_6', 'tile_id_16_7', 'tile_id_16_8', 'tile_id_16_9',
    'tile_id_17_5', 'tile_id_17_6', 'tile_id_17_7', 'tile_id_17_8', 'tile_id_17_9',
    'tile_id_18_5', 'tile_id_18_6', 'tile_id_18_7', 'tile_id_18_8', 'tile_id_18_9',
    'tile_id_19_5', 'tile_id_19_6', 'tile_id_19_7', 'tile_id_19_8', 'tile_id_19_9',
    'tile_id_20_6', 'tile_id_20_7', 'tile_id_20_8', 'tile_id_20_9',
    'tile_id_21_5', 'tile_id_21_6', 'tile_id_21_7', 'tile_id_21_8',
    'tile_id_22_5', 'tile_id_22_6',
    'tile_id_23_5', 'tile_id_23_6',
  ]
  tileArr = []

  async getData() {
    this.isLoading = true;
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

    for (let i of this.data1) {
      let id = i['id'].substring(0, 5);
      let rate = i['rate']

      if (!this.avgData1[id]) {
        this.avgData1[id] = {
          rateArr: []
        }
      }
      this.avgData1[id].rateArr.push(rate)
    }

    for (let i in this.avgData1) {
      if (this.avgData1[i]['rateArr'].length !== 0) {
        this.avgData1[i]['avg'] = this.avgData1[i]['rateArr'].reduce((accumulator, currentValue) => accumulator + currentValue, 0) / this.avgData1[i]['rateArr'].length
      } else {
        this.avgData1[i]['avg'] = 0
      }
    }

    for (let i of this.data2) {
      let id = i['id'].substring(0, 5);
      let rate = i['rate']

      if (!this.avgData2[id]) {
        this.avgData2[id] = {
          rateArr: []
        }
      }
      this.avgData2[id].rateArr.push(rate)
    }

    for (let i in this.avgData2) {
      if (this.avgData2[i]['rateArr'].length !== 0) {
        this.avgData2[i]['avg'] = this.avgData2[i]['rateArr'].reduce((accumulator, currentValue) => accumulator + currentValue, 0) / this.avgData2[i]['rateArr'].length
      } else {
        this.avgData2[i]['avg'] = 0
      }

    }
    this.isLoading = false;

    this.columns = csvData.columns
    this.columns.push('--')
    this.columns.sort()

    // this.state = await d3.json(`./assets/maps/${this.statesFileDict[this.selectedState]}`)
    this.state = await d3.json(`./assets/maps/${this.statesFileDict[this.selectedState]}`)
    this.topoJsonObjectsKey = Object.keys(this.state.objects)[0]


    for (let i in this.tileArr) {
      let fileName = this.tileArr[i]
      this.stateTile[i] = await d3.json(`./assets/maps/tiles/${fileName}.json`)

      let row = Number(fileName.substring(11))
      let col = Number(fileName.substring(8, 10))
      this.minRow = Math.min(this.minRow, row)
      this.minCol = Math.min(this.minCol, col)
    }

    //create dictionary to match county with tile_id
    for (let i in this.AllTilesArr) {
      let fileName = this.AllTilesArr[i]
      this.allStateTile[i] = await d3.json(`./assets/maps/tiles/${fileName}.json`)
    }

    for (let tileObj of this.allStateTile) {
      let tile_id = Object.keys(tileObj['objects'])[0]
      for (let tile_geometry of tileObj.objects[tile_id]['geometries']) {
        let county_id = tile_geometry['properties']['STCNTY']
        if (!this.countyidToTileid[county_id]) {
          this.countyidToTileid[county_id] = []
        }
        if (!this.countyidToTileid[county_id].includes(tile_id)) {
          this.countyidToTileid[county_id].push(tile_id)
        }

      }
    }

    if (this.useBivariate) {
      this.createBivariateChart()
    } else {
      this.createChart();
    }
  }

  countyidToTileid = {}


  private createChart(): void {
    const fullCountryArr = this.fullCountryArr
    const selectedState = this.selectedState
    let useCountry = fullCountryArr.includes(selectedState) ? true : false;

    const tractName = this.topoJsonObjectsKey
    const width = 975;
    const height = 610;

    const color1 = d3.scaleSequential(d3.interpolateBlues).domain([this.min1, this.max1]);
    const path = d3.geoPath();

    const valuemap1 = new Map(this.data1.map(d => [d.id, d.rate]));
    const valuemap2 = new Map(this.data2.map(d => [d.id, d.rate]));
    const valuemap3 = new Map(this.data3.map(d => [d.id, d.rate]));

    const avgData1 = this.avgData1
    const avgData2 = this.avgData2

    d3.select(this.scatterplotContainerId)
      .selectAll('svg')
      .remove();

    const svg = d3.select(this.scatterplotContainerId)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", `max-width: 100%; height: auto; transform-origin: 0 0;`)

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

    // Set up zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([1, 100])
      .on('zoom', (event) => {
        svg.attr('transform', event.transform);
      });

    // Function to zoom into a specific point (x, y)
    const zoomTo = (x, y, scale) => {
      svg.transition()
        .duration(100)
        .call(zoom.transform, d3.zoomIdentity.translate(width / 2 - scale * x, height / 2 - scale * y).scale(scale));
    };

    svg.call(zoom)
      .on("wheel.zoom", null)     // Disable zooming with the mouse wheel
      .on("mousedown.zoom", null) // Disable zooming by dragging
      .on("dblclick.zoom", null); // Disable zooming by double-clicking

    // Call zoomTo() immediately after creating the SVG
    zoomTo(this.mouseX, this.mouseY, this.zoomScale);

    // svg.on('click', (event) => {
    //   const [mouseX, mouseY] = d3.pointer(event);
    //   this.mouseX = mouseX
    //   this.mouseY = mouseY

    //   zoomTo(mouseX, mouseY, this.zoomScale);
    // });

    // Draw the counties with the color fill

    if (this.selectedCol1 !== '--') {
      const land = topojson.feature(this.state, {
        type: "GeometryCollection",
        geometries: this.state.objects[tractName].geometries.filter((d) => (d.properties.geoid / 10000 | 0) % 100 !== 99)
      });

      const [longitude, latitude] = this.stateCentroids[this.selectedState];
      const path = d3.geoPath()
        .projection(d3.geoTransverseMercator()
          .rotate([-longitude, -latitude])
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
          const prop = d['properties'];
          // const id = useCountry ? prop['FIPS'] : prop['GEOID']
          const id = useCountry ? prop['STCOFIPS'] : prop['GEOID']
          // const val1 = valuemap1.get(id)
          const val1 = useCountry ? avgData1[id]['avg'] : valuemap1.get(id)
          return color1(val1)
        })
        // .on("mouseover", function (event, d) {
        //   const prop = d['properties'];
        //   // const id = useCountry ? prop.FIPS : prop.GEOID;
        //   const id = useCountry ? prop['STCOFIPS'] : prop['GEOID']
        //   const val1String = useCountry ? avgData1[id]['avg']: (valuemap1.get(id) !== undefined ? valuemap1.get(id).toFixed(5) : 'N/A');
        //   d3.select(this).style("cursor", "pointer");
        //   tooltip.transition().duration(100).style("opacity", 1);
        //   const state = useCountry ? prop.STATE : fipsToState[prop.STATEFP]
        //   const stateId = useCountry ? prop.ST : prop.STATEFP
        //   const censusTractId = useCountry ? prop.LOCATION.match(/Census Tract (\d+),/)[1] : prop.NAME
        //   const fipscode = useCountry ? prop.STCNTY : prop.STATEFP + prop.COUNTYFP;
        //   const countyName = useCountry ? prop.COUNTY : `${fipsToCounty[fipscode]['County']}`;
        //   tooltip.html(`State: ${state} (${stateId})<br>County: ${countyName} (${fipscode})<br>Census Tract: ${censusTractId}<br>${col1Name}: ${val1String}`)
        //     .style("left", (event.pageX + 10) + "px")
        //     .style("top", (event.pageY - 10) + "px");
        // })
        // .on("mouseout", function (event, d) {
        //   d3.select(this).style("cursor", "default");  // Change cursor back to default when not hovering
        //   tooltip.transition().duration(100).style("opacity", 0);  // Hide tooltip
        // })
        .on("click", function (event, d) {
          tooltip.transition().duration(100).style("opacity", 0);
        })
        .attr("d", path)

      // Draw the pattern layer on top of the colored counties
      if (this.selectedCol2 !== '--') {
        svg.append("g")
          .selectAll("path")
          .data(topojson.feature(this.state, this.state.objects[tractName])['features'])
          .join("path")
          .attr("fill", "url(#diagonal-stripe)")  // Second layer: pattern fill with opacity
          // .on("mouseover", function (event, d) {
          //   const prop = d['properties'];
          //   const id = useCountry ? prop.FIPS : prop.GEOID;
          //   const val1String = valuemap1.get(id) !== undefined ? valuemap1.get(id).toFixed(5) : 'N/A';
          //   const val2String = valuemap2.get(id) !== undefined ? valuemap2.get(id).toFixed(5) : 'N/A';
          //   d3.select(this).style("cursor", "pointer");
          //   tooltip.transition().duration(100).style("opacity", 1);
          //   const state = useCountry ? prop.STATE : fipsToState[prop.STATEFP]
          //   const stateId = useCountry ? prop.ST : prop.STATEFP
          //   const censusTractId = useCountry ? prop.LOCATION.match(/Census Tract (\d+),/)[1] : prop.NAME
          //   const fipscode = useCountry ? prop.STCNTY : prop.STATEFP + prop.COUNTYFP;
          //   const countyName = useCountry ? prop.COUNTY : `${fipsToCounty[fipscode]['County']}`;
          //   tooltip.html(`State: ${state} (${stateId})<br>County: ${countyName} (${fipscode})<br>Census Tract: ${censusTractId}<br>${col1Name}: ${val1String}<br>${col2Name}: ${val2String}`)
          //     .style("left", (event.pageX + 10) + "px")
          //     .style("top", (event.pageY - 10) + "px");
          // })
          // .on("mouseout", function (event, d) {
          //   d3.select(this).style("cursor", "default");  // Change cursor back to default when not hovering
          //   tooltip.transition().duration(100).style("opacity", 0);  // Hide tooltip
          // })
          .on("click", function (event, d) {

            tooltip.transition().duration(100).style("opacity", 0);
          })
          .attr("d", path)
          .attr("opacity", d => {
            const prop = d['properties']
            const id = useCountry ? prop['FIPS'] : prop['GEOID']
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
            const prop = d['properties'];
            const id = useCountry ? prop.FIPS : prop.GEOID;
            const val1String = valuemap1.get(id) !== undefined ? valuemap1.get(id).toFixed(5) : 'N/A';
            const val2String = valuemap2.get(id) !== undefined ? valuemap2.get(id).toFixed(5) : 'N/A';
            const val3String = valuemap3.get(id) !== undefined ? valuemap3.get(id).toFixed(5) : 'N/A';
            d3.select(this).style("cursor", "pointer");
            tooltip.transition().duration(100).style("opacity", 1);
            const state = useCountry ? prop.STATE : fipsToState[prop.STATEFP]
            const stateId = useCountry ? prop.ST : prop.STATEFP
            const censusTractId = useCountry ? prop.LOCATION.match(/Census Tract (\d+),/)[1] : prop.NAME
            const fipscode = useCountry ? prop.STCNTY : prop.STATEFP + prop.COUNTYFP;
            const countyName = useCountry ? prop.COUNTY : `${fipsToCounty[fipscode]['County']}`;
            tooltip.html(`State: ${state} (${stateId})<br>County: ${countyName} (${fipscode})<br>Census Tract: ${censusTractId}<br>${col1Name}: ${val1String}<br>${col2Name}: ${val2String}<br>${col3Name}: ${val3String}`)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 10) + "px");
          })
          .on("mouseout", function (event, d) {
            d3.select(this).style("cursor", "default");  // Change cursor back to default when not hovering
            tooltip.transition().duration(100).style("opacity", 0);  // Hide tooltip
          })
          .on("click", function (event, d) {
            tooltip.transition().duration(100).style("opacity", 0);
          })
          .attr("d", path)
          .attr("opacity", d => {
            // const id = d['properties']['GEOID']
            const prop = d['properties']
            const id = useCountry ? prop['FIPS'] : prop['GEOID']
            const rate = this.data3Obj[id]['rate']
            if (id !== undefined && rate !== 0) {
              return rate / this.max3 + 0.2
            }
            return 0
          })



        // .append("title")
        // .text(d => `${d['properties'].name}, ${statemap.get(d['id'].slice(0, 2))['properties'].name}\n${this.selectedCol1.charAt(0).toUpperCase() + this.selectedCol1.slice(1)}: ${valuemap1.get(d['id'])?.toFixed(5)}\n${this.selectedCol1.charAt(0).toUpperCase() + this.selectedCol2.slice(1)}: ${valuemap2.get(d['id'])?.toFixed(5)}`);

        // Create the grid for the legend
        const k = 24; // size of each cell in the grid
        const n = 3 // Grid size for the legend
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

  createBivariateChart() {
    const fullCountryArr = this.fullCountryArr
    const selectedState = this.selectedState
    let useCountry = fullCountryArr.includes(selectedState) ? true : false;
    let useCensusCountry = selectedState === 'USA 2018 Mainland' || selectedState === 'single tile' ? true : false

    const tractName = this.topoJsonObjectsKey
    const width = this.zoomScale >= 3 ? 600 : 975;
    const height = this.zoomScale >= 3 ? 600 : 610;


    const tileWidth = 300;
    const tileHeight = 300;

    const valuemap1 = new Map(this.data1.map(d => [d.id, d.rate]));
    const valuemap2 = new Map(this.data2.map(d => [d.id, d.rate]));

    const avgData1 = this.avgData1
    const avgData2 = this.avgData2

    let xRange1 = this.min1;
    let xRange2 = (this.max1 - this.min1) / 3 + this.min1
    let xRange3 = 2 * ((this.max1 - this.min1) / 3) + this.min1
    let xRange4 = this.max1

    let yRange1 = this.min2;
    let yRange2 = (this.max2 - this.min2) / 3 + this.min2
    let yRange3 = 2 * ((this.max2 - this.min2) / 3) + this.min2
    let yRange4 = this.max2

    let currZoomScale = this.zoomScale
    const countyidToTileid = this.countyidToTileid

    const fipsToState = this.fipsToState
    const fipsToCounty = this.fipsToCounty
    const col1Name = this.selectedCol1.charAt(0).toUpperCase() + this.selectedCol1.slice(1).toLowerCase();
    const col2Name = this.selectedCol2.charAt(0).toUpperCase() + this.selectedCol2.slice(1).toLowerCase();

    d3.selectAll(".tooltip").transition().duration(100).style("opacity", 0)

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
      .attr("style", `width: auto; height: auto; scale: ${this.zoomScale}; transform-origin: 0 0;`)

    if (this.zoomScale >= 3) {
      this.tileArr.forEach((d, i) => {
        let tileName = d;

        const land = topojson.feature(this.stateTile[i], {
          type: "GeometryCollection",
          geometries: this.stateTile[i].objects[tileName].geometries
        });

        svg.append("style").text(`.tract:hover {fill: orange }`);

        //d3.geoEquirectangular keeps its in a rectangular shape for tiling
        const projection = d3.geoEquirectangular()
          .rotate([0, 0]) // You can remove this if you don't want any rotation
          .fitExtent([[0, 0], [tileWidth, tileHeight]], land);

        const path = d3.geoPath().projection(projection);

        let row = Number(this.tileArr[i].substring(11))
        let col = Number(this.tileArr[i].substring(8, 10))
        svg.append('g')
          .attr('transform', `translate(${(col - this.minCol) * tileWidth}, ${(row - this.minRow) * tileHeight})`)
          .selectAll('path')
          .data(land['features'])
          .enter().append('path')
          .attr('d', path)
          .attr("class", "tract")
          .attr("fill", d => {
            const fips = 'FIPS'
            const id = this.fullCountryArr.includes(this.selectedState) ? d['properties'][fips] : d['properties']['GEOID'];
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
            d3.select(this).style("cursor", "pointer");
            tooltip.transition().duration(100).style("opacity", 1);
            const fipscode = useCountry ? prop['STCNTY'] : prop.STATEFP + prop.COUNTYFP;
            const countyName = useCountry ? prop['COUNTY'] : `${fipsToCounty[fipscode]['County']}`;

            const id = useCountry ? prop['FIPS'] : prop['GEOID']
            const stateId = useCountry ? prop.ST : prop.STATEFP
            const state = useCountry ? prop.STATE : fipsToState[prop.STATEFP]
            const censusTractId = useCountry ? prop.LOCATION.match(/Census Tract (\d+(\.\d+)?),/)[1] : prop.NAME
            const val1String = valuemap1.get(id) !== undefined ? valuemap1.get(id).toFixed(5) : 'N/A';
            const val2String = valuemap2.get(id) !== undefined ? valuemap2.get(id).toFixed(5) : 'N/A';
            tooltip.html(`State: ${state} (${stateId})<br>County: ${countyName} (${fipscode})<br>Census Tract: ${censusTractId}<br>${col1Name}: ${val1String}<br>${col2Name}: ${val2String}`)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 10) + "px");

          })
          .on("mouseout", function (event, d) {
            d3.select(this).style("cursor", "default");  // Change cursor back to default when not hovering
            tooltip.transition().duration(100).style("opacity", 0);  // Hide tooltip
          })
          .attr('stroke', 'rgba(119, 119, 119, .7)')
          .attr('stroke-width', .2)
          .on("click", (event, d) => {
            let countyId = d['properties']['STCNTY']
            let currTile = this.countyidToTileid[countyId]
            const [mouseX, mouseY] = d3.pointer(event);
            this.zoomScale += 1
            zoomTo(mouseX / 2, mouseY / 1.5, this.zoomScale);

            if (this.zoomScale === 3) {
              this.tileArr = currTile
              this.loadTiles()
            } else if(this.zoomScale > 3) {
              this.createBivariateChart()
            }
          })

      })
    } else {
      const land = topojson.feature(this.state, {
        type: "GeometryCollection",
        // geometries: this.state.objects[tractName].geometries.filter((d) => (d.properties.geoid / 10000 | 0) % 100 !== 99)
        geometries: this.state.objects[tractName].geometries
      });

      svg.append("style").text(`
        .tract:hover {fill: orange }
      `);
      const fipsToState = this.fipsToState
      const fipsToCounty = this.fipsToCounty
      const col1Name = this.selectedCol1.charAt(0).toUpperCase() + this.selectedCol1.slice(1).toLowerCase();
      const col2Name = this.selectedCol2.charAt(0).toUpperCase() + this.selectedCol2.slice(1).toLowerCase();

      const [longitude, latitude] = this.stateCentroids[this.selectedState];
      const projection = d3.geoTransverseMercator()
        .rotate([-longitude, -latitude])
        .fitExtent([[0, 0], [width, height]], land);

      // Create a new path generator for each tile using the tile-specific projection
      const path = d3.geoPath().projection(projection);

      // Add the part of the map corresponding to this tile
      svg.append('g')
        .selectAll('path')
        .data(land['features'])
        // .data(filteredArr)
        .enter().append('path')
        .attr('d', path)
        .attr("class", "tract")
        .attr("fill", d => {
          const fips = selectedState === 'USA 2000 Mainland (County)' ? 'STCOFIPS' : 'FIPS'

          const id = this.fullCountryArr.includes(this.selectedState) ? d['properties'][fips] : d['properties']['GEOID'];
          // const id = this.fullCountryArr.includes(this.selectedState) ? d['id'] : d['properties']['GEOID'];
          const val1 = selectedState === 'USA 2000 Mainland (County)' ? (this.avgData1[id] ? this.avgData1[id]['avg'] : -1) : valuemap1.get(id);
          const val2 = selectedState === 'USA 2000 Mainland (County)' ? (this.avgData2[id] ? this.avgData2[id]['avg'] : -1) : valuemap2.get(id);

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
          d3.select(this).style("cursor", "pointer");
          tooltip.transition().duration(100).style("opacity", 1);
          const fipscode = useCountry ? prop['STCNTY'] : prop.STATEFP + prop.COUNTYFP;
          const countyName = useCountry ? prop['COUNTY'] : `${fipsToCounty[fipscode]['County']}`;
          if (useCountry && !useCensusCountry) {
            const id = prop.STCOFIPS
            const state = prop.STATE_NAME
            const stateId = prop.STATE_FIPS
            const val1String = avgData1[id] !== undefined ? avgData1[id].avg.toFixed(5) : 'N/A'
            const val2String = avgData2[id] !== undefined ? avgData2[id].avg.toFixed(5) : 'N/A'
            tooltip.html(`State: ${state} (${stateId})<br>County: ${countyName}<br>${col1Name}: ${val1String}<br>${col2Name}: ${val2String}`)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 10) + "px");
          }
          else {
            const id = useCountry ? prop['FIPS'] : prop['GEOID']
            const stateId = useCountry ? prop.ST : prop.STATEFP
            const state = useCountry ? prop.STATE : fipsToState[prop.STATEFP]
            const censusTractId = useCountry ? prop.LOCATION.match(/Census Tract (\d+),/)[1] : prop.NAME
            const val1String = valuemap1.get(id) !== undefined ? valuemap1.get(id).toFixed(5) : 'N/A';
            const val2String = valuemap2.get(id) !== undefined ? valuemap2.get(id).toFixed(5) : 'N/A';
            tooltip.html(`State: ${state} (${stateId})<br>County: ${countyName} (${fipscode})<br>Census Tract: ${censusTractId}<br>${col1Name}: ${val1String}<br>${col2Name}: ${val2String}`)
              .style("left", (event.pageX + 10) + "px")  // Position tooltip
              .style("top", (event.pageY - 10) + "px");
          }

        })
        .on("mouseout", function (event, d) {
          d3.select(this).style("cursor", "default");  // Change cursor back to default when not hovering
          tooltip.transition().duration(100).style("opacity", 0);  // Hide tooltip
        })
        .attr('stroke', 'rgba(119, 119, 119, .7)')
        .attr('stroke-width', .2)
        .on("click", (event, d) => {
          let countyId = d['properties']['STCOFIPS']
          let currTile = this.countyidToTileid[countyId]
          const [mouseX, mouseY] = d3.pointer(event);
          this.zoomScale += 1
          zoomTo(mouseX / 2, mouseY / 1.5, this.zoomScale);

          if (this.zoomScale === 3) {
            this.tileArr = currTile
            this.loadTiles()
          } 
        })
    }


    // Set up zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([1, 100])  // Limit zoom extent
      .on('zoom', (event) => {
        const transform = event.transform;

        // svg.select('.tiles').remove();

        // const tileGroup = svg.append('g').attr('class', 'tiles');

        // Get the currently visible tiles
        // this.visibleTiles = getVisibleTiles(transform);

        // // Render only visible tiles
        // this.visibleTiles.forEach(([tileX, tileY]) => {
        //   const tileId = `tile-${tileX}-${tileY}`;
        //   tileGroup.append('g')
        //     .attr('class', 'tile')
        //     .attr('data-tile-id', tileId)  // Add unique identifier
        //     .attr('transform', `translate(${tileX * tileSize}, ${tileY * tileSize})`)
        // });

        // Apply the transform to the SVG
        svg.attr('transform', transform.toString());
      });

    // Function to zoom into a specific point (x, y) with a defined scale
    const zoomTo = (x, y, scale) => {
      this.mouseX = x
      this.mouseY = y
      this.zoomScale = scale
      svg.transition()
        .duration(100)
        .call(zoom.transform, d3.zoomIdentity
          .translate(width / 2 - (scale * x) * 1.8, height / 2 - (scale * y) * 1.2)  // Adjust translation
          .scale(scale));  // Set zoom scale

      if (this.zoomScale === 3) {
        this.createBivariateChart()
      }
    };

    svg.call(zoom)
      .on("wheel.zoom", null)     // Disable zooming with the mouse wheel
      .on("mousedown.zoom", null) // Disable zooming by dragging
      .on("dblclick.zoom", null); // Disable zooming by double-clicking

    // svg.on('click', (event) => {
    //   const [mouseX, mouseY] = d3.pointer(event);
    //   this.mouseX = mouseX
    //   this.mouseY = mouseY
    //   this.zoomScale += 1
    //   zoomTo(mouseX / 2, mouseY / 1.5, this.zoomScale);
    // });

    // Create the grid for the legend
    const k = 24; // size of each cell in the grid 
    const n = 3 // Grid size for the legend
    const legendGroup = svg.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('transform', `translate(${width - 100}, ${height - 175}) rotate(-45 ${k * n / 2},${k * n / 2}) scale(${1 / this.zoomScale})`);

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

  applyZoom(direction) {
    if (direction === '+' && this.zoomScale < 30) {
      this.zoomScale += 1
    } else if (direction === '-' && this.zoomScale > 1) {
      this.zoomScale -= 1
    }

    // this.zoomScale += 1

    if (this.useBivariate) {
      this.createBivariateChart()
    } else {
      this.createChart()
    }
  }

  preventHistoryNavigation(event: WheelEvent): void {
    const container = event.currentTarget as HTMLElement;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;

    if ((container.scrollLeft === 0 && event.deltaX < 0) ||
      (container.scrollLeft >= maxScrollLeft && event.deltaX > 0)) {
      event.preventDefault();
    }
  }

  async loadTiles() {
    console.log("loadtiles: ", this.tileArr)
    // if(this.zoomScale === 3){
    this.addAdjacentTiles()
    // }

    for (let i in this.tileArr) {
      let fileName = this.tileArr[i]
      this.stateTile[i] = await d3.json(`./assets/maps/tiles/${fileName}.json`)

      let row = Number(fileName.substring(11))
      let col = Number(fileName.substring(8, 10))
      this.minRow = Math.min(this.minRow, row)
      this.minCol = Math.min(this.minCol, col)
    }

    if (this.useBivariate) {
      this.createBivariateChart()
    } else {
      this.createChart();
    }

  }

  //currently this show 2 tiles. commented out code includs 4 adjacent tiles
  addAdjacentTiles() {
    this.tileArr.forEach(tile => {
      const [_, col, row] = tile.match(/tile_id_(\d+)_(\d+)/).map(Number);
      const tileRight = `tile_id_${col+1}_${row}`;
      const tileLeft = `tile_id_${col-1}_${row}`;
      // const tileBelow = `tile_id_${col}_${row+1}`;
      // const tileAbove = `tile_id_${col}_${row-1}`;
      // const tileBelowRight = `tile_id_${col + 1}_${row + 1}`;
      // const tileBelowLeft = `tile_id_${col - 1}_${row + 1}`;
      // const tileAboveRight = `tile_id_${col + 1}_${row - 1}`;
      // const tileAboveLeft = `tile_id_${col - 1}_${row - 1}`;

      if (this.AllTilesArr.includes(tileRight)) {
        if (!this.tileArr.includes(tileRight)) this.tileArr.push(tileRight);
      } else if (this.AllTilesArr.includes(tileLeft)) {
        if (!this.tileArr.includes(tileLeft)) this.tileArr.push(tileLeft);
      }

      // if (this.AllTilesArr.includes(tileBelow)) {
      //   if (!this.tileArr.includes(tileBelow)) this.tileArr.push(tileBelow);

      //   if (this.AllTilesArr.includes(tileRight) && !this.tileArr.includes(tileBelowRight)) {
      //     this.tileArr.push(tileBelowRight);
      //   } else if (this.AllTilesArr.includes(tileLeft) && !this.tileArr.includes(tileBelowLeft)) {
      //     this.tileArr.push(tileBelowLeft);
      //   }
      // } else if (this.AllTilesArr.includes(tileAbove)) {
      //   if (!this.tileArr.includes(tileAbove)) this.tileArr.push(tileAbove);

      //   if (this.AllTilesArr.includes(tileRight) && !this.tileArr.includes(tileAboveRight)) {
      //     this.tileArr.push(tileAboveRight);
      //   } else if (this.AllTilesArr.includes(tileLeft) && !this.tileArr.includes(tileAboveLeft)) {
      //     this.tileArr.push(tileAboveLeft);
      //   }
      // }
    });
  }


}
