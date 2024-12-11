import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { CsvDataService } from '../csv-data.service';

interface GroceryData {
  id: string;
  rate: number;
}

interface CarmenData {
  id: string;
  rate: string;
}

@Component({
  selector: 'app-leaflet-map',
  templateUrl: './leaflet-map.component.html',
  styleUrls: ['./leaflet-map.component.scss']
})
export class LeafletMapComponent implements OnInit {
  @Input() dataFromSidebar: any;
  @Input() dataFromSidebarStateNameOnly: any;
  @Output() dataToSidebar = new EventEmitter<{}>();


  private map: L.Map | undefined;
  private data1: GroceryData[] = [];
  private data2: GroceryData[] = [];
  private data3: GroceryData[] = [];
  private dataCarmen: CarmenData[] = [];

  layerControl!: L.Control.Layers;

  yearCols = []
  columns = []
  minYear = 1900
  maxYear = 2099
  showYears = false
  // showRedline: boolean = false
  useBivariate: boolean = true

  selectedYear: string = '2017';
  selectedCol1: string = 'population';
  // selectedCol1: string = 'nsdoh_profiles'
  // selectedCol2: string = '--';
  selectedCol2: string = 'count_sales_445110';
  selectedCol3: string = '--';
  selectedState = 'USA 2000 Mainland (County)';
  statesArr = ['USA 2000 Mainland (County)', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"]
  // fullCountryArr = ['USA 2000 Mainland (County)', 'USA 2018 Mainland', 'USA 2020 Mainland', 'USA 2000 Mainland']

  stateName = 'United States of America'
  // currentMap = 'svi_2000_us_county_11_25_test.json'

  colors = [
    "#e8e8e8", "#ace4e4", "#5ac8c8",
    "#dfb0d6", "#a5add3", "#5698b9",
    "#be64ac", "#8c62aa", "#3b4994"
  ]

  min1: number = 10000000000;
  max1: number = 0;
  min2: number = 10000000000;
  max2: number = 0;
  min3: number = 10000000000;
  max3: number = 0;

  columnsUsed = 0;
  avgData1 = {};
  avgData2 = {};
  avgData3 = {};
  avgDataCat1 = {}

  colorCategories = []
  sidebarData = {};

  isLoading = false

  previousZoomLevel = 4
  currentZoomLevel = 4
  currentBounds: L.LatLngBoundsLiteral = [
    [24.396308, -125.0], // Southwest corner (latitude, longitude)
    [49.384358, -66.93457], // Northeast corner
  ];

  constructor(
    private http: HttpClient,
    private csvDataService: CsvDataService
  ) { }

  ngOnChanges() {
    if (this.dataFromSidebar !== undefined) {
      this.selectedYear = this.dataFromSidebar['years']
      this.selectedCol1 = this.dataFromSidebar['col1']
      this.selectedCol2 = this.dataFromSidebar['col2']
      this.selectedCol3 = this.dataFromSidebar['col3']
      this.selectedState = this.dataFromSidebar['map']
      this.useBivariate = this.dataFromSidebar['useBivariate']
      this.stateName = this.dataFromSidebar['stateName']
      // this.showRedline = this.dataFromSidebar['showRedline']
      this.resetVariables()
      this.loadCSVData()
    }
    if (this.dataFromSidebarStateNameOnly !== undefined) {
      this.stateName = this.dataFromSidebarStateNameOnly
      this.http.get('/assets/maps/tiles_no_redline/boundsDict.json').subscribe((boundsData) => {
        console.log("bounds: ", boundsData)
        this.currentBounds = boundsData[this.stateName.toLowerCase()]
        this.loadAndInitializeMap()
      });
    }
  }

  //bounds: [[west, north], [east, south]]
  tileBounds: any = {}
  redlineData = []

  ngOnInit(): void {
    this.http.get('/assets/maps/tiles_no_redline/tile_boundaries.json').subscribe((data) => {
      this.tileBounds = data
    });

    this.http.get('./assets/maps/tiles_no_redline/mappinginequality.json').subscribe((geojsonData: any) => {
      this.redlineData = geojsonData
    })
    this.loadCSVData()
  }

  sendData() {
    this.sidebarData = {
      "years": this.yearCols,
      "columns": this.columns,
      // "maps": this.statesArr,
      "selectedYear": this.selectedYear,
      // "selectedMap": this.selectedState,
      "selectedCol": [this.selectedCol1, this.selectedCol2, this.selectedCol3],
      "stateName": this.stateName
    }
    this.dataToSidebar.emit(this.sidebarData);

  }

  resetVariables() {
    this.min1 = Infinity;
    this.max1 = -Infinity;
    this.min2 = Infinity;
    this.max2 = -Infinity;
    this.min3 = Infinity;
    this.max3 = -Infinity;

    this.data1 = [];
    this.data2 = [];
    this.data3 = [];
    this.dataCarmen = [];

    this.avgData1 = {};
    this.avgData2 = {};
    this.avgData3 = {};
    this.avgDataCat1 = {}
  }

  // visibleTiles = []
  // tiles = []

  async loadCSVData(): Promise<void> {
    this.isLoading = true
    let csvFile = './assets/data/nanda_grocery_tract_2003-2017_01P.csv'
    let carmenFile = './assets/data/nsdoh_data.csv'
    try {
      const groceryData = await this.csvDataService.loadCSVData(csvFile);
      const carmenData = await this.csvDataService.loadCSVData(carmenFile);

      //get min/max values for Years
      if (this.yearCols.length === 0) {
        for (const d of groceryData) {
          if (d['year'] && !this.yearCols.includes(d['year'])) {
            this.yearCols.push(d['year'])
          }
        }
        this.yearCols.sort((a, b) => a - b);
        this.minYear = this.yearCols[0]
        this.maxYear = this.yearCols[this.yearCols.length - 1]
        this.showYears = true

      }

      for (const d of carmenData) {
        const id = d['GEOID']
        const rate = d['nsdoh_profiles']
        this.dataCarmen.push({
          id: id,
          rate: rate
        })
      }

      for (const d of groceryData) {
        if (d['year'] === this.selectedYear) {
          let rate1 = Math.log(Number(d[this.selectedCol1]) + 1);
          let rate2 = Math.log(Number(d[this.selectedCol2]) + 1);
          let rate3 = Math.log(Number(d[this.selectedCol3]) + 1);
          let population = d['population'] !== undefined ? Number(d['population']) : 0

          if (!isNaN(rate1) && rate1 !== null && rate1 !== undefined && rate1 !== -1 && rate1 !== -Infinity) {
            this.min1 = Math.min(this.min1, rate1)
            this.max1 = Math.max(this.max1, rate1)
            this.data1.push({
              id: d['tract_fips10'],
              rate: rate1,
              population: population
            } as GroceryData);
          }

          if (!isNaN(rate2) && rate2 !== null && rate2 !== undefined && rate2 !== -1 && rate2 !== -Infinity) {
            this.min2 = Math.min(this.min2, rate2)
            this.max2 = Math.max(this.max2, rate2)
            this.data2.push({
              id: d['tract_fips10'],
              rate: rate2,
              population: population
            } as GroceryData);
          }

          if (!isNaN(rate3) && rate3 !== null && rate3 !== undefined && rate3 !== -1 && rate3 !== -Infinity) {
            this.min3 = Math.min(this.min3, rate3)
            this.max3 = Math.max(this.max3, rate3)
            this.data3.push({
              id: d['tract_fips10'],
              rate: rate3,
              population: population
            } as GroceryData);
          }
        }
      }

      this.columnsUsed = 0
      if (this.selectedCol1 !== '--') {
        this.columnsUsed += 1;
        for (let i of this.data1) {
          let id = i['id'].substring(0, 5);
          let rate = i['rate']
          let pop = i['population']

          if (!this.avgData1[id]) {
            this.avgData1[id] = {
              rateArr: [],
              populationArr: []
            }
          }
          this.avgData1[id].rateArr.push(rate)
          this.avgData1[id].populationArr.push(pop)
        }

        for (let i in this.avgData1) {
          if (this.avgData1[i]['rateArr'].length !== 0) {
            this.avgData1[i]['sum'] = this.avgData1[i]['populationArr'].reduce((accumulator, currentValue) => accumulator + currentValue, 0)
          } else {
            this.avgData1[i]['sum'] = 0
          }
        }

        for (let i in this.avgData1) {
          if (this.avgData1[i]['rateArr'].length !== 0) {
            if (this.avgData1[i]['avg'] === undefined) {
              this.avgData1[i]['avg'] = 0
            }
            for (let index in this.avgData1[i]['rateArr']) {
              let rate = Number(this.avgData1[i]['rateArr'][index])
              let pop = Number(this.avgData1[i]['populationArr'][index])
              let popSum = Number(this.avgData1[i]['sum'])
              let weightedRate = rate * pop / popSum
              this.avgData1[i]['avg'] += weightedRate
            }
          }
        }
      }

      if (this.selectedCol2 !== '--') {
        this.columnsUsed += 1;
        for (let i of this.data2) {
          let id = i['id'].substring(0, 5);
          let rate = i['rate']
          let pop = i['population']

          if (!this.avgData2[id]) {
            this.avgData2[id] = {
              rateArr: [],
              populationArr: []
            }
          }
          this.avgData2[id].rateArr.push(rate)
          this.avgData2[id].populationArr.push(pop)
        }

        for (let i in this.avgData2) {
          if (this.avgData2[i]['rateArr'].length !== 0) {
            this.avgData2[i]['sum'] = this.avgData2[i]['populationArr'].reduce((accumulator, currentValue) => accumulator + currentValue, 0)
          } else {
            this.avgData2[i]['sum'] = 0
          }
        }

        for (let i in this.avgData2) {
          if (this.avgData2[i]['rateArr'].length !== 0) {
            if (this.avgData2[i]['avg'] === undefined) {
              this.avgData2[i]['avg'] = 0
            }
            for (let index in this.avgData2[i]['rateArr']) {
              let rate = Number(this.avgData2[i]['rateArr'][index])
              let pop = Number(this.avgData2[i]['populationArr'][index])
              let popSum = Number(this.avgData2[i]['sum'])
              let weightedRate = rate * pop / popSum
              this.avgData2[i]['avg'] += weightedRate
            }
          }
        }
      }

      if (this.selectedCol3 !== '--') {
        this.columnsUsed += 1;
        for (let i of this.data3) {
          let id = i['id'].substring(0, 5);
          let rate = i['rate']
          let pop = i['population']

          if (!this.avgData3[id]) {
            this.avgData3[id] = {
              rateArr: [],
              populationArr: []
            }
          }
          this.avgData3[id].rateArr.push(rate)
          this.avgData3[id].populationArr.push(pop)
        }

        for (let i in this.avgData3) {
          if (this.avgData3[i]['rateArr'].length !== 0) {
            this.avgData3[i]['sum'] = this.avgData3[i]['populationArr'].reduce((accumulator, currentValue) => accumulator + currentValue, 0)
          } else {
            this.avgData3[i]['sum'] = 0
          }
        }

        for (let i in this.avgData3) {
          if (this.avgData3[i]['rateArr'].length !== 0) {
            if (this.avgData3[i]['avg'] === undefined) {
              this.avgData3[i]['avg'] = 0
            }
            for (let index in this.avgData3[i]['rateArr']) {
              let rate = Number(this.avgData3[i]['rateArr'][index])
              let pop = Number(this.avgData3[i]['populationArr'][index])
              let popSum = Number(this.avgData3[i]['sum'])
              let weightedRate = rate * pop / popSum
              this.avgData3[i]['avg'] += weightedRate
            }
          }
        }
      }

      //collects info to find which profile appears the most in a County
      if (this.selectedCol1 === 'nsdoh_profiles') {
        for (let i of this.dataCarmen) {
          let id = i['id'].substring(0, 5);
          let rate = i['rate']

          if (!this.avgDataCat1[id]) {
            this.avgDataCat1[id] = {
              rateArr: []
            }
          }
          this.avgDataCat1[id].rateArr.push(rate)

          if (!this.colorCategories.includes(rate)) {
            this.colorCategories.push(rate)
          }
        }

        this.colorCategories = this.colorCategories.sort()

        for (let i in this.avgDataCat1) {
          let arr = this.avgDataCat1[i]['rateArr']
          let topProfile = this.findMostFrequent(arr)
          this.avgDataCat1[i]['mostFreq'] = topProfile
        }

      }

      this.columns = Object.keys(groceryData[0])
      this.columns.push('--')
      this.columns.push('nsdoh_profiles')
      this.columns.sort()

      this.isLoading = false

      this.sendData()
      this.loadAndInitializeMap()
    } catch (error) {
      console.error('Error loading CSV data:', error);
    }

  }

  // currentCensusTractsMapArr = ['tile_id_21_5.json']
  currentCensusTractsMapArr = []
  fullMapArr = ['svi_2000_us_county_11_25_test.json']
  useNewMap = true

  loadAndInitializeMap(): void {
    let currMap = []
    if (this.currentZoomLevel >= 9) {
      currMap = this.currentCensusTractsMapArr
    } else {
      currMap = this.fullMapArr
    }
    let index = 0
    for (let map of currMap) {
      index++
      this.useNewMap = index === 1 ? true : false

      let mapPath = this.currentZoomLevel >= 9 ? `tiles_no_redline/${map}` : map

      this.http.get(`./assets/maps/${mapPath}`).subscribe({
        next: (data) => {
          this.initializesMap(data);
        },
        error: (err) => {
          console.error('Error loading JSON:', err);
        },
        complete: () => {
          console.log('Request completed.');
        },
      });
    }

  }

  // layerControl

  initializesMap(area: any): void {
    const mapContainer = document.getElementById('map-container');

    if (!mapContainer) {
      console.error('Map container element not found!');
      return;
    }

    if (this.map && this.useNewMap) {
      this.map.remove();
      this.map = undefined; // Clear the reference to the map instance
    }

    if (this.useNewMap) {
      this.map = L.map(mapContainer);
    }

    const redlineLayer = L.geoJSON(this.redlineData, {
      style: function (d) {
        const pane = 'redPane'
        let fillColor = d['properties']['fill']

        return {
          pane: pane,
          color: '#808080',
          opacity: 1,
          weight: 1,
          fillColor: fillColor,
          fillOpacity: .6
        }
      },
      onEachFeature: (feature, layer) => {
        let city = feature.properties['city']
        let state = feature.properties['state']
        let category = feature.properties['category']
        let label = feature.properties['label']
        let city_survey = feature.properties['city_survey']
        let commercial = feature.properties['commercial']
        let residential = feature.properties['residential']

        let redLineTooltip = `
            <strong> Location:</strong> ${city || 'N/A'}, ${state || 'N/A'}<br>
            <strong> Category:</strong> ${category || 'N/A'}<br>
            <strong> Label:</strong> ${label || 'N/A'}<br>
            <strong> City Survey:</strong> ${city_survey || 'N/A'}<br>
            <strong> Commericial:</strong> ${commercial || 'N/A'}<br>
            <strong> Residential:</strong> ${residential || 'N/A'}<br>
          `;
        layer.bindTooltip(redLineTooltip, {
          permanent: false,  // Tooltip will appear only on hover
          direction: 'top',   // Tooltip position relative to the feature
          opacity: 1          // Make the tooltip fully opaque
        });
      }
    })
    // .addTo(this.map!);

    const openStreetMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });
    openStreetMapLayer.addTo(this.map);

    const openTopoMapLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
    });
    // openTopoMapLayer.addTo(this.map);

    const cartoDBLightLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
    });
    // cartoDBLightLayer.addTo(this.map);

    const humanitarianOSMLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    // humanitarianOSMLayer.addTo(this.map);

    const wikimediaLayer = L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://foundation.wikimedia.org/wiki/Maps_Terms_of_Use">Wikimedia Maps</a>'
    });
    // wikimediaLayer.addTo(this.map);

    // Define layer control
    const baseLayers = {
      'Open Street Map': openStreetMapLayer,
      'Open Topo Map': openTopoMapLayer,
      'CartoDB - Light': cartoDBLightLayer,
      'Humanitarian OSM': humanitarianOSMLayer,
      'Wikimedia': wikimediaLayer
    };

    const overlays = {
      'Redlining Districts': redlineLayer
    };
    if (this.layerControl) {
      this.map.removeControl(this.layerControl);
    }
    this.layerControl = L.control.layers(baseLayers, overlays).addTo(this.map);


    let xRange1 = this.min1;
    let xRange2 = (this.max1 - this.min1) / 3 + this.min1
    let xRange3 = 2 * ((this.max1 - this.min1) / 3) + this.min1
    let xRange4 = this.max1

    let yRange1 = this.min2;
    let yRange2 = (this.max2 - this.min2) / 3 + this.min2
    let yRange3 = 2 * ((this.max2 - this.min2) / 3) + this.min2
    let yRange4 = this.max2

    let avgData1 = this.avgData1
    let avgData2 = this.avgData2

    // let showRedline = this.showRedline

    const valuemap1 = new Map(this.data1.map(d => [d.id, d.rate]));
    const valuemap2 = new Map(this.data2.map(d => [d.id, d.rate]));
    const valuemap3 = new Map(this.data3.map(d => [d.id, d.rate]));
    let colors = this.colors
    let currentZoom = this.currentZoomLevel
    let selectedCol1 = this.selectedCol1
    let selectedCol2 = this.selectedCol2
    let selectedCol3 = this.selectedCol3

    this.map.createPane('redPane');
    this.map.getPane('redPane').style.zIndex = '500';

    this.map.createPane('tractsPane');
    this.map.getPane('tractsPane').style.zIndex = '499';

    this.map.fitBounds(this.currentBounds);
    if(this.currentZoomLevel >= 9){
      this.currentZoomLevel = this.map.getZoom()
    }

    let areaLayer = L.geoJSON(area, {
      style: function (d) {
        const layer_type = d['properties']['layer_type']
        // const pane = layer_type === 'Redlining District' ? 'redPane' : 'tractsPane';
        const pane = 'tractsPane';
        const fips = currentZoom < 9 ? 'STCOFIPS' : 'FIPS'
        const id = d['properties'][fips]
        let val1 = currentZoom < 9 ? (avgData1?.[id]?.['avg'] ?? -1) : valuemap1.get(id)
        let val2 = currentZoom < 9 ? (avgData2?.[id]?.['avg'] ?? -1) : valuemap2.get(id)
        let color = 'white'
        if (val1 >= xRange1 && val1 < xRange2 && val2 >= yRange1 && val2 < yRange2) {
          color = colors[0];
        } else if (val1 >= xRange2 && val1 < xRange3 && val2 >= yRange1 && val2 < yRange2) {
          color = colors[1];
        } else if (val1 >= xRange3 && val1 <= xRange4 && val2 >= yRange1 && val2 < yRange2) {
          color = colors[2];
        } else if (val1 >= xRange1 && val1 < xRange2 && val2 >= yRange2 && val2 < yRange3) {
          color = colors[3];
        } else if (val1 >= xRange2 && val1 < xRange3 && val2 >= yRange2 && val2 < yRange3) {
          color = colors[4];
        } else if (val1 >= xRange3 && val1 <= xRange4 && val2 >= yRange2 && val2 < yRange3) {
          color = colors[5];
        } else if (val1 >= xRange1 && val1 < xRange2 && val2 >= yRange3 && val2 <= yRange4) {
          color = colors[6];
        } else if (val1 >= xRange2 && val1 < xRange3 && val2 >= yRange3 && val2 <= yRange4) {
          color = colors[7];
        } else if (val1 >= xRange3 && val1 <= xRange4 && val2 >= yRange3 && val2 <= yRange4) {
          color = colors[8];
        } else {
          color = 'white'
        }
        return {
          pane: pane,
          color: '#808080',
          opacity: 1,
          weight: 1,
          fillColor: color,
          fillOpacity: .9
        };
      },
      onEachFeature: function (feature, layer) {
        if (currentZoom < 9) {
          let state = feature.properties.STATE_NAME
          let county = feature.properties.COUNTY
          let fips = feature.properties.STCOFIPS
          let avgValue1 = avgData1[fips] && avgData1[fips]['avg'] ? avgData1[fips]['avg'] : 0
          let avgValue2 = avgData2[fips] && avgData2[fips]['avg'] ? avgData2[fips]['avg'] : 0
          let countyTooltip = `
            <strong> State:</strong> ${state || 'N/A'}<br>
            <strong> County:</strong> ${county || 'N/A'}<br>
            <strong> FIPS:</strong> ${fips || 'N/A'}<br>
            <strong> ${selectedCol1}:</strong> ${avgValue1.toFixed(2) || 'N/A'}<br>
            <strong> ${selectedCol2}:</strong> ${avgValue2.toFixed(2) || 'N/A'}<br>
          `;
          layer.bindTooltip(countyTooltip, {
            permanent: false,  // Tooltip will appear only on hover
            direction: 'top',   // Tooltip position relative to the feature
            opacity: 1          // Make the tooltip fully opaque
          });
        } else {
          let fips = feature.properties.FIPS
          let location = feature.properties.LOCATION

          const parts = location.split(",").map(part => part.trim());
          const censusTract = parts[0];
          const county = parts[1];
          const state = parts[2];
          let censusTractTooltip = `
              <strong> State:</strong> ${state || 'N/A'}<br>
              <strong> County:</strong> ${county || 'N/A'}<br>
              <strong> Census Tract:</strong> ${censusTract || 'N/A'}<br>
              <strong> FIPS:</strong> ${fips || 'N/A'}<br>
              <strong> ${selectedCol1}:</strong> ${valuemap1.get(fips).toFixed(2) || 'N/A'}<br>
              <strong> ${selectedCol2}:</strong> ${valuemap2.get(fips).toFixed(2) || 'N/A'}<br>
            `;
          layer.bindTooltip(censusTractTooltip, {
            permanent: false,  // Tooltip will appear only on hover
            direction: 'top',   // Tooltip position relative to the feature
            opacity: 1          // Make the tooltip fully opaque
          });
        }
      }
    }).addTo(this.map);
    areaLayer.addTo(this.map);
    // this.map.fitBounds(this.currentBounds);
    // if(this.currentZoomLevel >= 9){
    //   console.log("zoom: ", this.map.getZoom())
    //   this.currentZoomLevel = this.map.getZoom()
    // }
   
    this.previousZoomLevel = this.map.getZoom();
    this.map.on('zoomend', () => {
      this.currentZoomLevel = this.map.getZoom();

      if (currentZoom >= 9 && currentZoom > this.previousZoomLevel) {
        const bounds = this.map.getBounds();
        this.currentBounds = [bounds.getSouthWest(), bounds.getNorthEast()]
        this.currentCensusTractsMapArr = this.findIntersectingTiles(this.currentBounds)
        this.loadAndInitializeMap()
      } else if (currentZoom < 9 && currentZoom < this.previousZoomLevel) {
        const bounds = this.map.getBounds();
        // this.currentMap = 'svi_2000_us_county_11_25_test.json';
        this.currentBounds = [bounds.getSouthWest(), bounds.getNorthEast()]
        this.loadAndInitializeMap()
      }
    });

    this.map.on('moveend', () => {
      if (this.currentZoomLevel >= 9) {
        const bounds = this.map.getBounds();
        this.currentBounds = [bounds.getSouthWest(), bounds.getNorthEast()]
        let prevMapArr = this.currentCensusTractsMapArr
        this.currentCensusTractsMapArr = this.findIntersectingTiles(this.currentBounds)
        console.log("current census intersections: ", this.currentCensusTractsMapArr)
        if (JSON.stringify(prevMapArr) !== JSON.stringify(this.currentCensusTractsMapArr)) {
          console.log("not the same", prevMapArr, this.currentCensusTractsMapArr)
          this.loadAndInitializeMap()
        }
      }
    });

  }

  findMostFrequent(arr) {
    const counts = new Map();
    let mostFrequentItem = null;
    let maxCount = 0;

    for (const item of arr) {
      const count = (counts.get(item) || 0) + 1;
      counts.set(item, count);

      if (count > maxCount) {
        maxCount = count;
        mostFrequentItem = item;
      }
    }

    return mostFrequentItem;
  }

  findIntersectingTiles(currentBounds: [[number, number], [number, number]]) {
    const currentSouth = currentBounds[0]['lat'];
    const currentWest = currentBounds[0]['lng'];
    const currentNorth = currentBounds[1]['lat'];
    const currentEast = currentBounds[1]['lng'];

    const intersectingTiles = [];

    for (const [tileId, tileBound] of Object.entries(this.tileBounds)) {

      const tileWest = tileBound[0][0]
      const tileEast = tileBound[1][0]
      const tileNorth = tileBound[0][1]
      const tileSouth = tileBound[1][1]

      // Check if the tile bounds intersect with the current map bounds
      const isIntersecting =
        tileWest < currentEast && // Tile's west is left of the current east
        tileEast > currentWest && // Tile's east is right of the current west
        tileNorth > currentSouth && // Tile's north is above the current south
        tileSouth < currentNorth; // Tile's south is below the current north

      if (isIntersecting) {
        intersectingTiles.push(tileId);
      }
    }
    console.log("intersecting: ", intersectingTiles)

    return intersectingTiles;
  }


  onYearChange(year) {
    this.selectedYear = year.toString()
    this.resetVariables()
    this.loadCSVData()
  }
}
