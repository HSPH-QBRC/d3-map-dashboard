import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { CsvDataService } from '../csv-data.service';
import * as d3 from 'd3';
import 'leaflet.pattern';

interface GroceryData {
  id: string;
  rate: number;
}

interface CarmenData {
  id: string;
  rate: string;
}

@Component({
  selector: 'app-leaflet-map-lambda-api',
  templateUrl: './leaflet-map-lambda-api.component.html',
  styleUrls: ['./leaflet-map-lambda-api.component.scss']
})
export class LeafletMapLambdaApiComponent implements OnInit {

  @Input() dataFromSidebar: any;
  @Input() dataFromSidebarStateNameOnly: any;
  @Output() dataToSidebar = new EventEmitter<{}>();


  private map: L.Map | undefined;
  private data1: GroceryData[] = [];
  private data2: GroceryData[] = [];
  private data3: GroceryData[] = [];
  private dataCarmen: CarmenData[] = [];

  layerControl!: L.Control.Layers;

  yearCols = [2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017]
  columnsA = ['tract_fips10', 'year', 'population', 'aland10', 'count_445110', 'count_sales_445110', 'count_emp_445110', 'popden_445110', 'popden_sales_445110', 'popden_emp_445110', 'aden_445110', 'aden_sales_445110', 'aden_emp_445110', 'count_4452', 'count_sales_4452', 'count_emp_4452', 'popden_4452', 'popden_sales_4452', 'popden_emp_4452', 'aden_4452', 'aden_sales_4452', 'aden_emp_4452', 'count_452311', 'count_sales_452311', 'count_emp_452311', 'popden_452311', 'popden_sales_452311', 'popden_emp_452311', 'aden_452311', 'aden_sales_452311', 'aden_emp_452311']
  columnsB = ['nsdoh_profiles']
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
  // statesArr = ['USA 2000 Mainland (County)', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"]
  // fullCountryArr = ['USA 2000 Mainland (County)', 'USA 2018 Mainland', 'USA 2020 Mainland', 'USA 2000 Mainland']

  stateName = 'United States of America'

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

  prevSelectedYear
  prevSelectedCol1
  prevSelectedCol2
  prevSelectedCol3
  prevSelectedState
  prevStateName

  constructor(
    private http: HttpClient,
    private csvDataService: CsvDataService
  ) { }

  ngOnChanges() {
    this.prevSelectedYear = this.selectedYear
    this.prevSelectedCol1 = this.selectedCol1
    this.prevSelectedCol2 = this.selectedCol2
    this.prevSelectedCol3 = this.selectedCol3
    this.prevStateName = this.stateName

    if (this.dataFromSidebar !== undefined) {
      this.selectedYear = this.dataFromSidebar['years']
      this.selectedCol1 = this.dataFromSidebar['col1']
      this.selectedCol2 = this.dataFromSidebar['col2']
      this.selectedCol3 = this.dataFromSidebar['col3']
      this.selectedState = this.dataFromSidebar['map']
      this.useBivariate = this.dataFromSidebar['useBivariate']
      this.stateName = this.dataFromSidebar['stateName']

      //if columns changed load reset and loadcsvdata
      if (this.prevSelectedCol1 !== this.selectedCol1 || this.prevSelectedCol2 !== this.selectedCol2 || this.prevSelectedCol3 !== this.selectedCol3) {
        this.resetVariables()
        this.loadCSVData()
      } else {
        if (this.prevStateName !== this.stateName) {
          this.http.get('/assets/maps/tiles_no_redline/boundsDict.json').subscribe((boundsData) => {
            this.currentBounds = boundsData[this.stateName.toLowerCase()]
            this.loadAndInitializeMap()
          });
        } else {
          this.loadAndInitializeMap()
        }
      }
    }

    //handles if state name only is changed
    if (this.dataFromSidebarStateNameOnly !== undefined) {
      this.currentZoomLevel = 3
      this.stateName = this.dataFromSidebarStateNameOnly
      this.http.get('/assets/maps/tiles_no_redline/boundsDict.json').subscribe((boundsData) => {
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
      "columnsA": this.columnsA,
      "columnsB": this.columnsB,
      "selectedYear": this.selectedYear,
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

    this.fullData1 = {}
    this.fullData2 = {}
    this.fullData3 = {}

    this.fullAvgData1 = {}
    this.fullAvgData2 = {}
    this.fullAvgData3 = {}

    this.offset = 0
    if (this.selectedCol1 !== 'nsdoh_profiles') {
      this.groceryData = []
    }

  }

  fullData1 = {}
  fullData2 = {}
  fullData3 = {}
  fullAvgData1 = {}
  fullAvgData2 = {}
  fullAvgData3 = {}

  groceryData = []
  carmenData = []

  offset = 0
  showRedline = false

  fetchData = (category): Promise<void> => {
    return new Promise((resolve, reject) => {
      let batchCount = 0; // Keep track of the number of batches
      let done = false; // Flag to track if all data has been fetched

      // Function to fetch a batch of data
      const fetchBatch = (offset) => {
        let queryURL = `https://304ve2frbd.execute-api.us-east-2.amazonaws.com/default/dashboard-get-data?year=${this.selectedYear}&offset=${offset}`;
        if (this.selectedCol1 !== "--") {
          queryURL += `&column1=${this.selectedCol1}`;
        }
        if (this.selectedCol2 !== "--") {
          queryURL += `&column2=${this.selectedCol2}`;
        }
        if (this.selectedCol3 !== "--") {
          queryURL += `&column3=${this.selectedCol3}`;
        }

        return this.http
          .get(queryURL)
          .toPromise()
          .then((data: any) => {
            // Check if there is still data or if it's the last batch
            if (data && data.message !== 'No more rows available.') {
              if (category === 'grocery') {
                this.groceryData.push(...data);
              } else if (category === 'carmen') {
                this.carmenData.push(...data);
              }
              batchCount++;
              return true; // Indicate that data was received
            } else {
              done = true; // Mark as done when the backend returns no more data
              return false; // No more data to process
            }
          });
      };

      // Function to fetch in parallel, dynamically until all data is fetched
      const fetchNextBatch = () => {
        if (done) {
          // If all data is fetched, resolve the promise
          resolve();
          return;
        }

        // Fetch a batch of data
        const batchPromisesCurrent = [];
        const startOffset = this.offset + batchCount; // Calculate offset dynamically based on current batch count
        const numberOfParallelReq = 5

        for (let i = 0; i < numberOfParallelReq; i++) { // You can adjust the number of parallel requests here
          batchPromisesCurrent.push(fetchBatch(startOffset + i));
        }

        // Wait for the current batch to complete
        Promise.all(batchPromisesCurrent)
          .then((results) => {
            // If we have fetched any data, recursively call fetchNextBatch to continue
            if (results.some((result) => result === true)) {
              fetchNextBatch(); // Continue fetching if there was data returned
            } else {
              // No more data available, stop
              done = true;
              resolve();
            }
          })
          .catch((error) => {
            console.error("Error fetching data:", error);
            reject(error); // Reject the promise if an error occurs
          });
      };

      // Start the recursive fetching
      fetchNextBatch();
    });
  };


  async loadCSVData(): Promise<void> {
    // this.isLoading = true
    // let csvFile = './assets/data/nanda_grocery_tract_2003-2017_01P.csv'
    // let carmenFile = './assets/data/nsdoh_data.csv'
    try {
      // if (!this.groceryData) {
      // this.groceryData = await this.csvDataService.loadCSVData(csvFile);
      // }

      if (this.selectedCol1 === 'nsdoh_profiles') {
        console.time('fetching Carmen data')
        await this.fetchData('carmen')
        console.timeEnd('fetching Carmen data')
      } else {
        console.time('fetching Grocery data')
        this.isLoading = true
        await this.fetchData('grocery')
        this.isLoading = false
        console.timeEnd('fetching Grocery data')
      }


      // if (!this.carmenData) {
      //   this.carmenData = await this.csvDataService.loadCSVData(carmenFile);
      // }
      const groceryData = this.groceryData
      const carmenData = this.carmenData

      //get min/max values for Years
      // if (this.yearCols.length === 0) {
      //   for (const d of groceryData) {
      //     if (d['year'] && !this.yearCols.includes(d['year'])) {
      //       this.yearCols.push(d['year'])
      //     }
      //   }
      //   this.yearCols.sort((a, b) => a - b);
      //   this.minYear = this.yearCols[0]
      //   this.maxYear = this.yearCols[this.yearCols.length - 1]
      //   this.showYears = true

      // }
      this.yearCols = [2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017]
      this.minYear = 2003
      this.maxYear = 2017
      this.showYears = true

      for (const d of carmenData) {
        const id = d['GEOID']
        const rate = d['nsdoh_profiles']
        this.dataCarmen.push({
          id: id,
          rate: rate
        })
      }

      for (const d of groceryData) {
        let currYear = this.selectedYear
        if (!this.fullData1[currYear]) {
          this.fullData1[currYear] = []
        }
        if (!this.fullData2[currYear]) {
          this.fullData2[currYear] = []
        }
        if (!this.fullData3[currYear]) {
          this.fullData3[currYear] = []
        }

        let rate1 = Math.log(Number(d[this.selectedCol1]) + 1);
        let rate2 = Math.log(Number(d[this.selectedCol2]) + 1);
        let rate3 = Math.log(Number(d[this.selectedCol3]) + 1);
        let population = d['population'] !== undefined ? Number(d['population']) : 0

        if (!isNaN(rate1) && rate1 !== null && rate1 !== undefined && rate1 !== -1 && rate1 !== -Infinity) {
          this.min1 = Math.min(this.min1, rate1)
          this.max1 = Math.max(this.max1, rate1)

          this.fullData1[currYear].push({
            id: d['tract_fips10'],
            rate: rate1,
            population: population
          } as GroceryData);
        }

        if (!isNaN(rate2) && rate2 !== null && rate2 !== undefined && rate2 !== -1 && rate2 !== -Infinity) {
          this.min2 = Math.min(this.min2, rate2)
          this.max2 = Math.max(this.max2, rate2)
          this.fullData2[currYear].push({
            id: d['tract_fips10'],
            rate: rate2,
            population: population
          } as GroceryData);
        }

        if (!isNaN(rate3) && rate3 !== null && rate3 !== undefined && rate3 !== -1 && rate3 !== -Infinity) {
          this.min3 = Math.min(this.min3, rate3)
          this.max3 = Math.max(this.max3, rate3)
          this.fullData3[currYear].push({
            id: d['tract_fips10'],
            rate: rate3,
            population: population
          } as GroceryData);
        }
      }

      this.columnsUsed = 0
      if (this.selectedCol1 !== '--') {
        this.columnsUsed += 1;
        // for (let currYear of this.yearCols) {
        let currYear = this.selectedYear
        for (let i of this.fullData1[currYear]) {
          let id = i['id'].substring(0, 5);
          let rate = i['rate']
          let pop = i['population']

          if (!this.fullAvgData1[currYear]) {
            this.fullAvgData1[currYear] = {}
          }

          if (!this.fullAvgData1[currYear][id]) {
            this.fullAvgData1[currYear][id] = {
              rateArr: [],
              populationArr: []
            }
          }
          this.fullAvgData1[currYear][id].rateArr.push(rate)
          this.fullAvgData1[currYear][id].populationArr.push(pop)
        }

        for (let i in this.fullAvgData1[currYear]) {
          if (this.fullAvgData1[currYear][i]['rateArr'].length !== 0) {
            this.fullAvgData1[currYear][i]['sum'] = this.fullAvgData1[currYear][i]['populationArr'].reduce((accumulator, currentValue) => accumulator + currentValue, 0)
          } else {
            this.fullAvgData1[currYear][i]['sum'] = 0
          }
        }

        for (let i in this.fullAvgData1[currYear]) {
          if (this.fullAvgData1[currYear][i]['rateArr'].length !== 0) {
            if (this.fullAvgData1[currYear][i]['avg'] === undefined) {
              this.fullAvgData1[currYear][i]['avg'] = 0
            }
            for (let index in this.fullAvgData1[currYear][i]['rateArr']) {
              let rate = Number(this.fullAvgData1[currYear][i]['rateArr'][index])
              let pop = Number(this.fullAvgData1[currYear][i]['populationArr'][index])
              let popSum = Number(this.fullAvgData1[currYear][i]['sum'])
              let weightedRate = rate * pop / popSum
              this.fullAvgData1[currYear][i]['avg'] += weightedRate
            }
          }
        }

        // }
      }

      if (this.selectedCol2 !== '--') {
        this.columnsUsed += 1;
        // for (let currYear of this.yearCols) {
        let currYear = this.selectedYear
        for (let i of this.fullData2[currYear]) {
          let id = i['id'].substring(0, 5);
          let rate = i['rate']
          let pop = i['population']

          if (!this.fullAvgData2[currYear]) {
            this.fullAvgData2[currYear] = {}
          }

          if (!this.fullAvgData2[currYear][id]) {
            this.fullAvgData2[currYear][id] = {
              rateArr: [],
              populationArr: []
            }
          }
          this.fullAvgData2[currYear][id].rateArr.push(rate)
          this.fullAvgData2[currYear][id].populationArr.push(pop)
        }

        for (let i in this.fullAvgData2[currYear]) {
          if (this.fullAvgData2[currYear][i]['rateArr'].length !== 0) {
            this.fullAvgData2[currYear][i]['sum'] = this.fullAvgData2[currYear][i]['populationArr'].reduce((accumulator, currentValue) => accumulator + currentValue, 0)
          } else {
            this.fullAvgData2[currYear][i]['sum'] = 0
          }
        }

        for (let i in this.fullAvgData2[currYear]) {
          if (this.fullAvgData2[currYear][i]['rateArr'].length !== 0) {
            if (this.fullAvgData2[currYear][i]['avg'] === undefined) {
              this.fullAvgData2[currYear][i]['avg'] = 0
            }
            for (let index in this.fullAvgData2[currYear][i]['rateArr']) {
              let rate = Number(this.fullAvgData2[currYear][i]['rateArr'][index])
              let pop = Number(this.fullAvgData2[currYear][i]['populationArr'][index])
              let popSum = Number(this.fullAvgData2[currYear][i]['sum'])
              let weightedRate = rate * pop / popSum
              this.fullAvgData2[currYear][i]['avg'] += weightedRate
            }
          }
        }

        // }
      }

      if (this.selectedCol3 !== '--') {
        this.columnsUsed += 1;
        // for (let currYear of this.yearCols) {
        // for (let i of this.data1) {
        let currYear = this.selectedYear
        for (let i of this.fullData3[currYear]) {
          let id = i['id'].substring(0, 5);
          let rate = i['rate']
          let pop = i['population']

          if (!this.fullAvgData3[currYear]) {
            this.fullAvgData3[currYear] = {}
          }

          // if (!this.avgData1[id]) {
          if (!this.fullAvgData3[currYear][id]) {
            this.fullAvgData3[currYear][id] = {
              rateArr: [],
              populationArr: []
            }
          }
          this.fullAvgData3[currYear][id].rateArr.push(rate)
          this.fullAvgData3[currYear][id].populationArr.push(pop)
        }

        for (let i in this.fullAvgData3[currYear]) {
          if (this.fullAvgData3[currYear][i]['rateArr'].length !== 0) {
            this.fullAvgData3[currYear][i]['sum'] = this.fullAvgData3[currYear][i]['populationArr'].reduce((accumulator, currentValue) => accumulator + currentValue, 0)
          } else {
            this.fullAvgData3[currYear][i]['sum'] = 0
          }
        }

        for (let i in this.fullAvgData3[currYear]) {
          if (this.fullAvgData3[currYear][i]['rateArr'].length !== 0) {
            if (this.fullAvgData3[currYear][i]['avg'] === undefined) {
              this.fullAvgData3[currYear][i]['avg'] = 0
            }
            for (let index in this.fullAvgData3[currYear][i]['rateArr']) {
              let rate = Number(this.fullAvgData3[currYear][i]['rateArr'][index])
              let pop = Number(this.fullAvgData3[currYear][i]['populationArr'][index])
              let popSum = Number(this.fullAvgData3[currYear][i]['sum'])
              let weightedRate = rate * pop / popSum
              this.fullAvgData3[currYear][i]['avg'] += weightedRate
            }
          }
        }

        // }
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
      // this.columns.push('--')
      // this.columnsB.push('nsdoh_profiles')
      this.columnsA.sort()
      this.columnsB.sort()

      // this.isLoading = false

      this.sendData()
      this.loadAndInitializeMap()
    } catch (error) {
      console.error('Error loading CSV data from server:', error);
    }
  }

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
          this.addD3Legend();
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

    // const dashPattern = new L.StripePattern({
    //   weight: 2, // Thickness of stripes
    //   color: 'yellow', // Color of stripes
    //   spaceColor: 'transparent', // Space between stripes
    //   opacity: 1,
    //   angle: 45, // Angle of stripes
    // });

    // // Add pattern to the map
    // dashPattern.addTo(this.map);

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

        layer.on('click', function () {
          layer.bindTooltip(redLineTooltip, {
            permanent: false, // Tooltip will disappear when clicking elsewhere
            direction: 'top', // Tooltip position relative to the layer
            opacity: 1        // Make the tooltip fully opaque
          });
          layer.openTooltip(); // Display the tooltip immediately upon click
        });

        // Optionally, add a close handler if clicking elsewhere is needed
        layer.on('mouseout', function () {
          layer.closeTooltip(); // Close the tooltip when the mouse leaves the layer
        });
      }
    })

    const openStreetMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });
    openStreetMapLayer.addTo(this.map);

    const openTopoMapLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
    });

    const cartoDBLightLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
    });

    const humanitarianOSMLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    const wikimediaLayer = L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://foundation.wikimedia.org/wiki/Maps_Terms_of_Use">Wikimedia Maps</a>'
    });

    // Create the legend element
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'legend');

      // Use D3 to append the SVG and its elements
      const svg = d3.select(div)
        .append('svg')
        .attr('id', 'legend-container')
        .attr('width', 95)
        .attr('height', 100);

      // Add the title
      svg.append('text')
        .attr('class', 'legend-title')
        .attr('x', 0)
        .attr('y', 15)
        .text('Redlining Districts');

      // Define legend data
      const legendData = [
        { color: '#76a865', label: 'Best', y: 30 },
        { color: '#7cb5bd', label: 'Still Desirable', y: 45 },
        { color: '#ffff00', label: 'Definitely Declining', y: 60 },
        { color: '#d9838d', label: 'Hazardous', y: 75 },
        { color: '#000000', label: 'Commercial', y: 90 },
      ];

      // Add legend entries
      legendData.forEach((entry) => {
        svg.append('circle')
          .attr('class', 'legend-circle')
          .attr('cx', 10)
          .attr('cy', entry.y)
          .attr('r', 4)
          .attr('fill', entry.color);

        svg.append('text')
          .attr('class', 'legend-text')
          .attr('x', 20)
          .attr('y', entry.y)
          .attr('alignment-baseline', 'middle')
          .text(entry.label);
      });

      return div;
    };

    // Add event listeners for layer visibility toggling
    redlineLayer.on('add', () => {
      this.showRedline = true
      legend.addTo(this.map);
    });

    redlineLayer.on('remove', () => {
      this.showRedline = false
      legend.remove();
    });

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


    let min1 = this.min1
    let max1 = this.max1
    let min2 = this.min2
    let max2 = this.max2

    let xRange1 = this.min1;
    let xRange2 = (this.max1 - this.min1) / 3 + this.min1
    let xRange3 = 2 * ((this.max1 - this.min1) / 3) + this.min1
    let xRange4 = this.max1

    let yRange1 = this.min2;
    let yRange2 = (this.max2 - this.min2) / 3 + this.min2
    let yRange3 = 2 * ((this.max2 - this.min2) / 3) + this.min2
    let yRange4 = this.max2

    let avgData1 = this.fullAvgData1[this.selectedYear]
    let avgData2 = this.fullAvgData2[this.selectedYear]
    let avgDataCarmen = this.avgDataCat1

    const valuemap1 = new Map(this.fullData1[this.selectedYear].map(d => [d.id, d.rate]));
    const valuemap2 = new Map(this.fullData2[this.selectedYear].map(d => [d.id, d.rate]));
    const valuemap3 = new Map(this.fullData3[this.selectedYear].map(d => [d.id, d.rate]));
    const valuemapCarmen = new Map(this.dataCarmen.map(d => [d.id, d.rate]));

    let colors = this.colors
    let currentZoom = this.currentZoomLevel
    let selectedCol1 = this.selectedCol1
    let selectedCol2 = this.selectedCol2
    let selectedCol3 = this.selectedCol3

    let useBivariate = this.useBivariate

    const color2 = d3.scaleOrdinal()
      .domain(this.colorCategories)
      .range(d3.schemeSet3);

    let blues = ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'];

    let greens = [
      '#f7fcf5', // Very light green
      '#e5f5e0', // Light green
      '#c7e9c0', // Pale green
      '#a1d99b', // Soft green
      '#74c476', // Medium green
      '#41ab5d', // Vibrant green
      '#238b45', // Dark green
      '#006d2c', // Very dark green
      '#00441b', // Deep green
    ];

    let reds = [
      '#fff5f0', // Very light red
      '#fee0d2', // Light red
      '#fcbba1', // Pale red
      '#fc9272', // Soft red
      '#fb6a4a', // Medium red
      '#ef3b2c', // Vibrant red
      '#cb181d', // Dark red
      '#a50f15', // Very dark red
      '#67000d', // Deep red
    ];
    function getColor(value: number, min: number, max: number, chosenColor: string): string {
      let color = chosenColor === 'blue' ? blues : reds
      if (value < min) return color[0]; // Ensure we handle values below the range
      if (value > max) return color[color.length - 1]; // Ensure we handle values above the range

      const normalized = (value - min) / (max - min); // Normalize value to 0–1
      const index = Math.floor(normalized * (color.length - 1)); // Use Math.floor to avoid overshooting the array
      return color[index];
    }

    this.map.createPane('redPane');
    this.map.getPane('redPane').style.zIndex = '500';

    this.map.createPane('tractsPane');
    this.map.getPane('tractsPane').style.zIndex = '499';

    this.map.fitBounds(this.currentBounds);
    if (this.currentZoomLevel >= 9) {
      this.currentZoomLevel = this.map.getZoom()
    }

    let areaLayer = L.geoJSON(area, {
      style: function (d) {
        if (useBivariate) {
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
        } else if (!useBivariate) {
          if (selectedCol1 === 'nsdoh_profiles') {
            const pane = 'tractsPane';
            let id = currentZoom < 9 ? d['properties'].STCOFIPS : d['properties'].FIPS
            const profile = currentZoom < 9 ? (avgDataCarmen[id] !== undefined ? avgDataCarmen[id]['mostFreq'] : "Profile 9 ") : valuemapCarmen.get(id)
            return {
              pane: pane,
              color: '#2a2a2a',
              opacity: .6,
              weight: 1,
              fillColor: color2(profile),
              fillOpacity: .9,
            };
          } else {
            const pane = 'tractsPane';
            const fips = currentZoom < 9 ? 'STCOFIPS' : 'FIPS'
            const id = d['properties'][fips]
            let val1 = currentZoom < 9 ? (avgData1?.[id]?.['avg'] ?? -1) : valuemap1.get(id)

            return {
              pane: pane,
              color: '#2a2a2a',
              opacity: .6,
              weight: 1,
              fillColor: getColor(val1, min1, max1, 'blue'),
              fillOpacity: .9,
            };
          }

        }
      },
      onEachFeature: function (feature, layer) {
        if (selectedCol1 === 'nsdoh_profiles') {
          if (currentZoom < 9) {
            console.log("going to here from nsdoh")
            let state = feature.properties.STATE_NAME
            let county = feature.properties.COUNTY
            let censusTract = feature.properties.STCOFIPS
            let colName = selectedCol1
            let profile = avgDataCarmen[censusTract] !== undefined ? avgDataCarmen[censusTract]['mostFreq'] : "N/A"


            let nsdohProfileToolTip = `
                <strong> State:</strong> ${state || 'N/A'}<br>
                <strong> County:</strong> ${county || 'N/A'}<br>
                <strong> Census Tract:</strong> ${censusTract || 'N/A'}<br>
                <strong> ${colName}:</strong> ${profile || 'N/A'}<br>
              `;
            layer.on('click', function () {
              layer.bindTooltip(nsdohProfileToolTip, {
                permanent: false, // Tooltip will disappear when clicking elsewhere
                direction: 'top', // Tooltip position relative to the layer
                opacity: 1        // Make the tooltip fully opaque
              });
              layer.openTooltip(); // Display the tooltip immediately upon click
            });

            // Optionally, add a close handler if clicking elsewhere is needed
            layer.on('mouseout', function () {
              layer.closeTooltip(); // Close the tooltip when the mouse leaves the layer
            });

          } else {
            let state = feature.properties.STATE
            state = state.charAt(0) + state.slice(1).toLowerCase();
            let county = feature.properties.COUNTY
            let censusTract = feature.properties.FIPS
            let colName = selectedCol1
            let profile = valuemapCarmen.get(censusTract)

            let nsdohProfileToolTip = `
                <strong> State:</strong> ${state || 'N/A'}<br>
                <strong> County:</strong> ${county || 'N/A'}<br>
                <strong> Census Tract:</strong> ${county || 'N/A'}<br>
                <strong> ${colName}:</strong> ${profile || 'N/A'}<br>
              `;

            layer.on('click', function () {
              layer.bindTooltip(nsdohProfileToolTip, {
                permanent: false, // Tooltip will disappear when clicking elsewhere
                direction: 'top', // Tooltip position relative to the layer
                opacity: 1        // Make the tooltip fully opaque
              });
              layer.openTooltip(); // Display the tooltip immediately upon click
            });

            // Optionally, add a close handler if clicking elsewhere is needed
            layer.on('mouseout', function () {
              layer.closeTooltip(); // Close the tooltip when the mouse leaves the layer
            });

          }
        } else {
          if (currentZoom < 9) {
            let state = feature.properties.STATE_NAME
            let county = feature.properties.COUNTY
            let fips = feature.properties.STCOFIPS
            let avgValue1 = avgData1[fips] && avgData1[fips]['avg'] ? avgData1[fips]['avg'] : 0
            let avgValue2 = selectedCol2 !== '--' ? (avgData2[fips] && avgData2[fips]['avg'] ? avgData2[fips]['avg'] : 0) : 0

            let countyTooltip =
              `<strong> State:</strong> ${state || 'N/A'}<br>
              <strong> County:</strong> ${county || 'N/A'}<br>
              <strong> FIPS:</strong> ${fips || 'N/A'}<br>
              <strong> ${selectedCol1}:</strong> ${avgValue1.toFixed(2) || 'N/A'}<br>`;

            // Add optional column 2 content if applicable
            if (selectedCol2 !== '--') {
              countyTooltip += `<strong> ${selectedCol2}:</strong> ${avgValue2.toFixed(2) || 'N/A'}<br>`;
            }
            // layer.bindTooltip(countyTooltip, {
            //   permanent: false,  // Tooltip will appear only on hover
            //   direction: 'top',   // Tooltip position relative to the feature
            //   opacity: 1          // Make the tooltip fully opaque
            // });
            layer.on('click', function () {
              layer.bindTooltip(countyTooltip, {
                permanent: false, // Tooltip will disappear when clicking elsewhere
                direction: 'top', // Tooltip position relative to the layer
                opacity: 1        // Make the tooltip fully opaque
              });
              layer.openTooltip(); // Display the tooltip immediately upon click
            });

            // Optionally, add a close handler if clicking elsewhere is needed
            layer.on('mouseout', function () {
              layer.closeTooltip(); // Close the tooltip when the mouse leaves the layer
            });
          } else {
            let fips = feature.properties.FIPS
            let location = feature.properties.LOCATION

            const parts = location.split(",").map(part => part.trim());
            const censusTract = parts[0];
            const county = parts[1];
            const state = parts[2];
            const val1 = Number(valuemap1.get(fips))
            const val2 = Number(valuemap2.get(fips))
            let censusTractTooltip = `
                <strong> State:</strong> ${state || 'N/A'}<br>
                <strong> County:</strong> ${county || 'N/A'}<br>
                <strong> Census Tract:</strong> ${censusTract || 'N/A'}<br>
                <strong> FIPS:</strong> ${fips || 'N/A'}<br>
                <strong> ${selectedCol1}:</strong> ${val1.toFixed(2) || 'N/A'}<br>
                <strong> ${selectedCol2}:</strong> ${val2.toFixed(2) || 'N/A'}<br>
              `;
            // layer.bindTooltip(censusTractTooltip, {
            //   permanent: false,  // Tooltip will appear only on hover
            //   direction: 'top',   // Tooltip position relative to the feature
            //   opacity: 1          // Make the tooltip fully opaque
            // });
            // Add click event listener to show the tooltip
            layer.on('click', function () {
              layer.bindTooltip(censusTractTooltip, {
                permanent: false, // Tooltip will disappear when clicking elsewhere
                direction: 'top', // Tooltip position relative to the layer
                opacity: 1        // Make the tooltip fully opaque
              });
              layer.openTooltip(); // Display the tooltip immediately upon click
            });

            // Optionally, add a close handler if clicking elsewhere is needed
            layer.on('mouseout', function () {
              layer.closeTooltip(); // Close the tooltip when the mouse leaves the layer
            });
          }
        }
      }
    }).addTo(this.map);
    areaLayer.addTo(this.map);
    const map = this.map

    if (!useBivariate && selectedCol2 !== '--') {
      let areaLayer2 = L.geoJSON(area, {
        style: function (d) {
          const pane = 'tractsPane';
          const fips = currentZoom < 9 ? 'STCOFIPS' : 'FIPS'
          const id = d['properties'][fips]
          let val2 = currentZoom < 9 ? (avgData2?.[id]?.['avg'] ?? -1) : valuemap2.get(id)

          let opacity = val2 / max2 + 0.2
          const dashPattern2 = new L.StripePattern({
            weight: 2, // Thickness of stripes
            color: getColor(val2, min2, max2, 'red'), // Color of stripes
            spaceColor: 'white', // Space between stripes
            opacity: 1,
            angle: 45, // Angle of stripes
          });

          // Add pattern to the map
          dashPattern2.addTo(map);
          return {
            pane: pane,
            color: '#2a2a2a',
            // opacity: .6,
            weight: 1,
            // fillColor: getColor(val2, min1, max1, 'red'),
            // fillColor: 'red',
            fillOpacity: 1,
            fillPattern: dashPattern2,
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
            // layer.bindTooltip(countyTooltip, {
            //   permanent: false,  // Tooltip will appear only on hover
            //   direction: 'top',   // Tooltip position relative to the feature
            //   opacity: 1          // Make the tooltip fully opaque
            // });

            layer.on('click', function () {
              layer.bindTooltip(countyTooltip, {
                permanent: false, // Tooltip will disappear when clicking elsewhere
                direction: 'top', // Tooltip position relative to the layer
                opacity: 1        // Make the tooltip fully opaque
              });
              layer.openTooltip(); // Display the tooltip immediately upon click
            });

            // Optionally, add a close handler if clicking elsewhere is needed
            layer.on('mouseout', function () {
              layer.closeTooltip(); // Close the tooltip when the mouse leaves the layer
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
              <strong> ${selectedCol1}:</strong> ${valuemap1.get(fips) || 'N/A'}<br>
              <strong> ${selectedCol2}:</strong> ${valuemap2.get(fips) || 'N/A'}<br>
            `;
            // layer.bindTooltip(censusTractTooltip, {
            //   permanent: false,
            //   direction: 'top',
            //   opacity: 1
            // });
            layer.on('click', function () {
              layer.bindTooltip(censusTractTooltip, {
                permanent: false, // Tooltip will disappear when clicking elsewhere
                direction: 'top', // Tooltip position relative to the layer
                opacity: 1        // Make the tooltip fully opaque
              });
              layer.openTooltip(); // Display the tooltip immediately upon click
            });

            // Optionally, add a close handler if clicking elsewhere is needed
            layer.on('mouseout', function () {
              layer.closeTooltip(); // Close the tooltip when the mouse leaves the layer
            });


          }

        }
      }).addTo(this.map);
      areaLayer2.addTo(this.map);
    }

    this.previousZoomLevel = this.map.getZoom();
    this.map.on('zoomend', () => {
      this.currentZoomLevel = this.map.getZoom();
      const newZoom = this.map.getZoom();
      if (newZoom >= 9 && currentZoom > this.previousZoomLevel) {
        const bounds = this.map.getBounds();
        this.currentBounds = [bounds.getSouthWest(), bounds.getNorthEast()]
        this.currentCensusTractsMapArr = this.findIntersectingTiles(this.currentBounds)
        this.loadAndInitializeMap()
      } else if (newZoom < 9) {
        const bounds = this.map.getBounds();
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
        if (JSON.stringify(prevMapArr) !== JSON.stringify(this.currentCensusTractsMapArr)) {
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

      const isIntersecting =
        tileWest < currentEast &&
        tileEast > currentWest &&
        tileNorth > currentSouth &&
        tileSouth < currentNorth;

      if (isIntersecting) {
        intersectingTiles.push(tileId);
      }
    }

    return intersectingTiles;
  }

  onYearChange(year) {
    this.selectedYear = year.toString()
    // this.loadAndInitializeMap()
    this.resetVariables()
    this.loadCSVData()
  }

  legendControl

  addD3Legend(): void {
    if (this.legendControl) {
      this.map.removeControl(this.legendControl);
    }
    this.legendControl = L.control({ position: 'bottomright' });

    this.legendControl.onAdd = () => {
      const div = this.useBivariate ? L.DomUtil.create('div', 'd3-legend-container') : L.DomUtil.create('div', 'd3-legend-container2')
      this.createD3Legend(div);

      return div;
    };

    this.legendControl.addTo(this.map);
  }

  createD3Legend(container: HTMLElement): void {
    let bivariateViewBox = [-15, -15, 100, 100]
    let heatmapViewBox = [0, 0, 100, 100]
    const svgLegend = d3
      .select(container)
      .append("svg")
      .attr("width", 80)
      .attr("height", this.selectedCol1 === 'nsdoh_profiles' ? 120 : 80)
      .attr("viewBox", this.useBivariate ? bivariateViewBox : heatmapViewBox)

    if (this.useBivariate) {
      // Create the grid for the legend
      const k = 24; // size of each cell in the grid 
      const n = 3 // Grid size for the legend
      const legendGroup = svgLegend.append('g')
        .attr('font-family', 'sans-serif')
        .attr('font-size', 10)

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
      svgLegend.append('defs')
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
    } else {
      if (this.selectedCol1 === 'nsdoh_profiles') {
        const color2 = d3.scaleOrdinal()
          .domain(this.colorCategories)
          .range(d3.schemeSet3);

        svgLegend
          .append("text")
          .attr('class', 'legend-title')
          .attr("x", 0)
          .attr("y", -5)
          .text(`NSDOH Profiles`)
        // .style("font-size", "10px")
        // .attr("alignment-baseline", "start")

        for (let index in this.colorCategories) {
          let cat = this.colorCategories[index]
          let indexNum = Number(index)

          svgLegend.append("circle")
            .attr("cx", 10)
            .attr("cy", 12 + 15 * indexNum)
            .attr("r", 4)
            .style("fill", `${color2(cat)}`)

          svgLegend
            .append("text")
            .attr("x", 20)
            .attr("y", 12 + 15 * indexNum)
            .text(`${cat}`)
            .style("font-size", "10px")
            .attr("alignment-baseline", "middle")
        }


      } else {
        let legendWidth = 100
        let legendHeight = 75
        let separation = 20
        // const defsLegend = svgLegend.append("defs");
        const legendGroup = svgLegend.append('g')
          .attr('font-family', 'sans-serif')
          .attr('font-size', 10)
        if (this.selectedCol1 !== '--') {
          const blueGradient = legendGroup.append("linearGradient")
            .attr("id", "legendGradientBlue")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

          blueGradient.append("stop").attr("offset", "0%").attr("stop-color", "#f7fbff");
          blueGradient.append("stop").attr("offset", "20%").attr("stop-color", "#c6dbef");
          blueGradient.append("stop").attr("offset", "40%").attr("stop-color", "#6baed6");
          blueGradient.append("stop").attr("offset", "60%").attr("stop-color", "#3182bd");
          blueGradient.append("stop").attr("offset", "80%").attr("stop-color", "#08519c");
          blueGradient.append("stop").attr("offset", "100%").attr("stop-color", "#08306b");

          // Rectangle for blue gradient
          svgLegend.append("rect")
            .attr("x", 5)
            .attr("y", legendHeight - 50)
            .attr("width", 100)
            .attr("height", 10)
            .style("fill", "url(#legendGradientBlue)");

          svgLegend.append("text")
            .attr("x", 0)
            .attr("y", legendHeight - 55)
            .attr("text-anchor", "start")
            .attr("font-size", 8)
            .attr("font-weight", "bold")
            .text(this.selectedCol1 !== '--' ? `${this.selectedCol1.charAt(0).toUpperCase()}${this.selectedCol1.slice(1)}` : 'Column 1');

          // Text labels for blue gradient
          svgLegend.append("text")
            .attr("x", 0)
            .attr("y", legendHeight - 55 + 25)
            .attr("text-anchor", "start")
            .attr("font-size", 8)
            .text(`${Math.floor(this.min1 * 10) / 10}`);

          svgLegend.append("text")
            .attr("x", 100)
            .attr("y", legendHeight - 55 + 25)
            .attr("text-anchor", "end")
            .attr("font-size", 8)
            .text(`${Math.ceil(this.max1 * 10) / 10}`);
        }


        if (this.selectedCol2 !== '--') {
          // Define the second gradient from white to yellow
          // const yellowGradient = legendGroup.append("linearGradient")
          //   .attr("id", "legendGradientYellow")
          //   .attr("x1", "0%")
          //   .attr("y1", "0%")
          //   .attr("x2", "100%")
          //   .attr("y2", "0%");

          // yellowGradient.append("stop")
          //   .attr("offset", "0%")
          //   .attr("stop-color", "#ffff00")
          //   .attr("stop-opacity", 0);  // Transparent yellow

          // yellowGradient.append("stop")
          //   .attr("offset", "100%")
          //   .attr("stop-color", "#ffff00")
          //   .attr("stop-opacity", 1);  // Opaque yellow

          const gradient = legendGroup.append("linearGradient")
            // .append('linearGradient')
            .attr('id', 'legendGradientStripe')
            .attr('x1', '0%')
            .attr('x2', '100%')
            .attr('y1', '0%')
            .attr('y2', '0%');

          let reds = [
            '#fff5f0', // Very light red
            '#fee0d2', // Light red
            '#fcbba1', // Pale red
            '#fc9272', // Soft red
            '#fb6a4a', // Medium red
            '#ef3b2c', // Vibrant red
            '#cb181d', // Dark red
            '#a50f15', // Very dark red
            '#67000d', // Deep red
          ];

          // Apply the red color scale
          reds.forEach((color, i) => {
            gradient.append('stop')
              .attr('offset', `${(i / (reds.length - 1)) * 100}%`)
              .attr('stop-color', color);
          });

          // Append a rectangle using the gradient
          svgLegend.append('rect')
            .attr('x', 10)
            .attr('y', 10)
            .attr('width', 300)
            .attr('height', 20)
            .style('fill', 'url(#red-gradient)');

          // Rectangle for yellow gradient
          svgLegend.append("rect")
            .attr("x", 5)
            .attr("y", legendHeight - 35 + separation + 10)  // Position this rectangle below the first one
            .attr("width", 100)
            .attr("height", 10)
            .style("fill", "url(#legendGradientStripe)");

          // Text labels for yellow gradient
          svgLegend.append("text")
            .attr("x", 0)
            .attr("y", legendHeight - 40 + separation + 10)
            .attr("text-anchor", "start")
            .attr("font-size", 8)
            .attr("font-weight", "bold")
            // .text("Column 2:");
            .text(this.selectedCol2 !== '--' ? `${this.selectedCol2.charAt(0).toUpperCase()}${this.selectedCol2.slice(1)}` : 'Column 2');

          svgLegend.append("text")
            .attr("x", 0)
            .attr("y", legendHeight - 40 + separation + 25 + 10)
            .attr("text-anchor", "start")
            .attr("font-size", 8)
            // .text("Low");
            .text(`${Math.floor(this.min2 * 10) / 10}`);

          svgLegend.append("text")
            .attr("x", 100)
            .attr("y", legendHeight - 40 + separation + 25 + 10)
            .attr("text-anchor", "end")
            .attr("font-size", 8)
            // .text("High");
            .text(`${Math.ceil(this.max2 * 10) / 10}`);
        }

        if (this.selectedCol3 !== '--') {
          // Define the red gradient with transparency
          const redGradient = legendGroup.append("linearGradient")
            .attr("id", "legendGradientRed")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

          redGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#ff0000")
            .attr("stop-opacity", 0);

          redGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#ff0000")
            .attr("stop-opacity", 1);

          // Rectangle for red gradient with additional vertical separation
          svgLegend.append("rect")
            .attr("x", 5)
            .attr("y", (legendHeight - 35) * 2 + separation - 5 + 10 * 2)  // Adjust position for red gradient
            .attr("width", legendWidth)
            .attr("height", 10)
            .style("fill", "url(#legendGradientRed)");

          // Text labels for red gradient
          svgLegend.append("text")
            .attr("x", 0)
            .attr("y", (legendHeight - 40) * 2 + separation + 10 * 2)
            .attr("text-anchor", "start")
            .attr("font-size", 8)
            .attr("font-weight", "bold")
            .text(this.selectedCol3 !== '--' ? `${this.selectedCol3.charAt(0).toUpperCase()}${this.selectedCol3.slice(1)}` : 'Column 3');

          svgLegend.append("text")
            .attr("x", 0)
            .attr("y", (legendHeight - 40) * 2 + separation + 25 + 10 * 2)
            .attr("text-anchor", "start")
            .attr("font-size", 8)
            .text(`${Math.floor(this.min2 * 10) / 10}`);

          svgLegend.append("text")
            .attr("x", 100)
            .attr("y", (legendHeight - 40) * 2 + separation + 25 + 10 * 2)
            .attr("text-anchor", "end")
            .attr("font-size", 8)
            .text(`${Math.ceil(this.max2 * 10) / 10}`);
        }
      }

    }
  }

}
