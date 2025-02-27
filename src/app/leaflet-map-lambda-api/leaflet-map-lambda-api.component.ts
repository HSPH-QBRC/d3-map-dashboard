import { Component, OnInit, Input, Output, EventEmitter, } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import * as d3 from 'd3';
import 'leaflet.pattern';
import { ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import 'leaflet-easyprint';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';

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
  // private data1: GroceryData[] = [];
  // private data2: GroceryData[] = [];
  // private data3: GroceryData[] = [];
  private dataCarmen: CarmenData[] = [];

  layerControl!: L.Control.Layers;
  resetZoomControl!: L.Control.Layers;

  yearCols = [2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017]
  columnsA = ['tract_fips10', 'year', 'population', 'aland10', 'count_445110', 'count_sales_445110', 'count_emp_445110', 'popden_445110', 'popden_sales_445110', 'popden_emp_445110', 'aden_445110', 'aden_sales_445110', 'aden_emp_445110', 'count_4452', 'count_sales_4452', 'count_emp_4452', 'popden_4452', 'popden_sales_4452', 'popden_emp_4452', 'aden_4452', 'aden_sales_4452', 'aden_emp_4452', 'count_452311', 'count_sales_452311', 'count_emp_452311', 'popden_452311', 'popden_sales_452311', 'popden_emp_452311', 'aden_452311', 'aden_sales_452311', 'aden_emp_452311']
  columnsB = ['nsdoh_profiles']
  minYear = 1900
  maxYear = 2099
  showYears = false
  // showRedline: boolean = false
  // useBivariate: boolean = true;
  // useDashOverlay: boolean = false;
  // useSpike: boolean = false;
  selectedOverlay = 'Bivariate Choropleth'

  selectedYear: string = '2017';
  selectedCol1: string = 'population';
  // selectedCol1: string = 'nsdoh_profiles'
  // selectedCol2: string = '--';
  selectedCol2: string = 'count_sales_445110';
  // selectedCol3: string = '--';
  selectedMap = 'USA 2000 Mainland (County)';
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
  prevStateName

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private clipboard: Clipboard
  ) { }

  ngOnChanges() {
    this.prevSelectedYear = this.selectedYear
    this.prevSelectedCol1 = this.selectedCol1
    this.prevSelectedCol2 = this.selectedCol2
    this.prevStateName = this.stateName

    if (this.dataFromSidebar !== undefined) {
      this.selectedYear = this.dataFromSidebar['years']
      this.selectedCol1 = this.dataFromSidebar['col1']
      this.selectedCol2 = this.dataFromSidebar['col2']
      this.selectedMap = this.dataFromSidebar['map']
      this.stateName = this.dataFromSidebar['stateName']
      this.selectedOverlay = this.dataFromSidebar['selectedOverlay']

      //if columns changed load reset and loadcsvdata
      if (this.prevSelectedCol1 !== this.selectedCol1 || this.prevSelectedCol2 !== this.selectedCol2) {
        this.resetVariables()
        this.loadCSVData()
      } else {
        if (this.prevStateName !== this.stateName) {
          this.http.get('/assets/maps/tiles_no_redline/boundsDict.json').subscribe((boundsData) => {
            this.currentZoomLevel = 3
            this.currentBounds = boundsData[this.stateName.toLowerCase()]
            this.loadAndInitializeMap()
          });
        }
        else {
          //when overlay type changes
          this.useNewMap = true;
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

  tileBounds: any = {}
  redlineData: any = []
  paramsFound = false;

  ngOnInit(): void {
    this.route.queryParams
      .pipe(filter(params => Object.keys(params).length > 0)) // Ignore empty params
      .subscribe(params => {
        this.paramsFound = true
        this.selectedCol1 = params['col1'] || this.selectedCol1;
        this.selectedCol2 = params['col1'] && !params['col2'] ? '--' : (params['col2'] || this.selectedCol2)
        this.stateName = params['state'] || this.stateName;
        this.selectedYear = params['year'] || this.selectedYear;
        this.http.get('/assets/maps/tiles_no_redline/boundsDict.json').subscribe((boundsData) => {
          this.currentBounds = boundsData[this.stateName.toLowerCase()]
        });


        if (params['col1'] && !params['col2']) {
          this.selectedOverlay = 'Circles'
        }

        this.loadCSVData();
      });

    setTimeout(() => {
      if (!this.paramsFound) {
        this.loadCSVData();
      }
    }, 500)

    this.http.get('/assets/maps/tiles_no_redline/tile_boundaries.json').subscribe((data) => {
      this.tileBounds = data
    });

    this.http.get('./assets/maps/tiles_no_redline/mappinginequality.json').subscribe((geojsonData: any) => {
      this.redlineData = geojsonData
    })

  }

  sendData() {
    this.sidebarData = {
      "years": this.yearCols,
      "columnsA": this.columnsA,
      "columnsB": this.columnsB,
      "selectedYear": this.selectedYear,
      "selectedCol": [this.selectedCol1, this.selectedCol2],
      "stateName": this.stateName,
      "selectedOverlay": this.selectedOverlay
    }
    this.dataToSidebar.emit(this.sidebarData);

  }

  downloadMap() {
    this.isLoading = true
    const printer = L.easyPrint({
      title: 'Download Map',
      filename: 'leaflet-map',
      exportOnly: true, // Hides the print dialog
      sizeModes: ['A4Landscape']
    }).addTo(this.map);

    // Automatically trigger the download after the plugin is added
    setTimeout(() => {
      printer.printMap('CurrentSize', 'leaflet-map');
      this.isLoading = false;
    }, 200); // Delay to ensure the plugin initializes properly
  }

  shareLink() {
    let baseUrl = 'http://map-dashboard-app.s3-website.us-east-2.amazonaws.com/data';
    let params = new URLSearchParams();

    if (this.selectedCol1 !== '--') {
      params.append('col1', this.selectedCol1);
    }
    if (this.selectedCol2 !== '--') {
      params.append('col2', this.selectedCol2);
    }
    if (this.stateName !== '--') {
      params.append('state', this.stateName);
    }
    if (this.selectedYear !== '--') {
      params.append('year', this.selectedYear);
    }

    let message = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

    this.onErrorSnackbar('Copied to clipboard: ' + message)
    this.clipboard.copy(message);
  }

  onErrorSnackbar(message): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'left',
      verticalPosition: 'bottom',
    });
  }

  resetVariables() {
    this.min1 = Infinity;
    this.max1 = -Infinity;
    this.min2 = Infinity;
    this.max2 = -Infinity;
    this.min3 = Infinity;
    this.max3 = -Infinity;

    // this.data1 = [];
    // this.data2 = [];
    // this.data3 = [];
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

    // this.map.remove();
    // const mapContainer = document.getElementById('map-container');
    // this.map = L.map(mapContainer);

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

  fetchData = (category, col1, col2): Promise<void> => {
    return new Promise((resolve, reject) => {
      let batchCount = 0; // Keep track of the number of batches
      let done = false; // Flag to track if all data has been fetched

      // Function to fetch a batch of data
      const fetchBatch = (offset) => {
        let queryURL = `https://304ve2frbd.execute-api.us-east-2.amazonaws.com/default/dashboard-get-data?year=${this.selectedYear}&offset=${offset}`;
        if (col1 !== "--") {
          queryURL += `&column1=${col1}`;
        }
        if (col2 !== "--") {
          queryURL += `&column2=${col2}`;
        }

        return this.http
          .get(queryURL)
          .toPromise()
          .then((data: any) => {
            // Check if there is still data or if it's the last batch
            if (data && data.message !== 'No more rows available.') {
              if (category === 'grocery') {
                this.groceryData.push(...data);
                // this.groceryData = [...this.groceryData, ...data];
              } else if (category === 'carmen') {
                this.carmenData.push(...data);
                // this.carmenData = [...this.carmenData, ...data];
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
    try {
      if (this.selectedCol1 === 'nsdoh_profiles') {
        console.time('fetching Carmen data')
        this.isLoading = true
        await this.fetchData('carmen', this.selectedCol1, this.selectedCol2)
        this.isLoading = false
        console.timeEnd('fetching Carmen data')

        if (this.selectedCol2 !== '--') {
          console.time('fetching Grocery data')
          this.isLoading = true
          await this.fetchData('grocery', this.selectedCol2, '--')
          this.isLoading = false
          console.timeEnd('fetching Grocery data')
        }

        this.selectedOverlay = 'Circles'
      } else {
        console.time('fetching Grocery data')
        this.isLoading = true
        await this.fetchData('grocery', this.selectedCol1, this.selectedCol2)
        this.isLoading = false
        console.timeEnd('fetching Grocery data')
      }
      const groceryData = this.groceryData
      const carmenData = this.carmenData

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
        // let rate3 = Math.log(Number(d[this.selectedCol3]) + 1);
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
      }

      this.columnsUsed = 0
      if (this.selectedCol1 !== '--' && this.selectedCol1 !== 'nsdoh_profiles') {
        this.columnsUsed += 1;
        let currYear = this.selectedYear

        // let fullData1 = this.fullData1[currYear]
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
      }

      if (this.selectedCol2 !== '--') {

        this.columnsUsed += 1;
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

      this.columnsA.sort()
      this.columnsB.sort()

      this.sendData()
      this.loadAndInitializeMap()
    } catch (error) {
      console.error('Error loading CSV data from server:', error);
    }
  }

  currentCensusTractsMapArr = []
  fullMapArr = ['svi_2000_us_county_11_25_test.json']
  useNewMap = true
  clickVal1
  clickVal2

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
      delete this.layerControl
    }

    this.layerControl = L.control.layers(baseLayers, overlays).addTo(this.map);

    if (this.resetZoomControl) {
      this.map.removeControl(this.resetZoomControl);
      // this.resetZoomControl = undefined
      delete this.resetZoomControl;
    }

    const defaultBounds = [
      [24.396308, -125.000000], // Southwest (bottom-left)
      [49.384358, -66.934570]  // Northeast (top-right)
    ];

    if (!this.resetZoomControl) {
      //add reset zoom button
      this.resetZoomControl = L.control({ position: 'topleft' });

      this.resetZoomControl.onAdd = (map) => {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-reset');
        div.innerHTML = '<i class="fa-solid fa-earth-americas"></i>';
        div.onclick = () => {
          this.stateName = 'United States of America'
          this.currentZoomLevel = 4
          this.currentBounds = [
            [24.396308, -125.0],
            [49.384358, -66.93457],
          ];
          this.sendData()
          map.fitBounds(defaultBounds);
        };
        return div;
      };

      this.resetZoomControl.addTo(this.map);
    }

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

    const valuemap1 = this.selectedCol1 !== 'nsdoh_profiles' ? new Map(this.fullData1[this.selectedYear].map(d => [d.id, d.rate])) : undefined;
    const valuemap2 = this.selectedCol2 !== '--' ? new Map(this.fullData2[this.selectedYear].map(d => [d.id, d.rate])) : undefined;
    const valuemapCarmen = new Map(this.dataCarmen.map(d => [d.id, d.rate]));

    let colors = this.colors
    let currentZoom = this.currentZoomLevel
    let selectedCol1 = this.selectedCol1
    let selectedCol2 = this.selectedCol2

    let selectedOverlay = this.selectedOverlay

    const color2 = d3.scaleOrdinal()
      .domain(this.colorCategories)
      .range(d3.schemeSet3);

    let blues = ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'];

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

    if (selectedOverlay === "Heatmap Overlays") {
      this.map.createPane('dashPane');
      this.map.getPane('dashPane').style.zIndex = '501';
    } else {
      //remove a pane when not in use
      const pane = this.map.getPane("dashPane");
      if (pane) {
        this.map.eachLayer(layer => {
          if ((layer as any).options && (layer as any).options.pane === "dashPane") {
            this.map.removeLayer(layer);
          }
        });

        pane.remove();
      }
    }

    if (selectedOverlay === "Circles") {
      this.map.createPane("circlePane");
      this.map.getPane("circlePane").style.zIndex = "551";
    } else {
      //remove a pane when not in use
      const pane = this.map.getPane("circlePane");
      if (pane) {
        this.map.eachLayer(layer => {
          if ((layer as any).options && (layer as any).options.pane === "circlePane") {
            this.map.removeLayer(layer);
          }
        });

        pane.remove();
      }
    }

    if (selectedOverlay === "Spikes") {
      this.map.createPane("spikePane");
      this.map.getPane("spikePane").style.zIndex = "553";
    } else {

      //remove a pane when not in use
      const pane = this.map.getPane("spikePane");
      if (pane) {
        this.map.eachLayer(layer => {
          if ((layer as any).options && (layer as any).options.pane === "spikePane") {
            this.map.removeLayer(layer);
          }
        });

        pane.remove();

      }
    }


    this.map.fitBounds(this.currentBounds);
    if (this.currentZoomLevel >= 9) {
      this.currentZoomLevel = this.map.getZoom()
    }
    let areaLayer = L.geoJSON(area, {
      style: function (d) {
        if (selectedOverlay === "Bivariate Choropleth") {
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
        } else if (selectedOverlay === "Heatmap Overlays" || selectedOverlay === "Circles" || selectedOverlay === "Spikes") {
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
            let avgValue2 = avgDataCarmen[censusTract] && avgDataCarmen[censusTract]['mostFreq'] ? avgDataCarmen[censusTract]['mostFreq'] : 0

            if (profile !== 'N/A') {
              layer.on('click', function () {
                layer.bindTooltip(nsdohProfileToolTip, {
                  permanent: false, // Tooltip will disappear when clicking elsewhere
                  direction: 'top', // Tooltip position relative to the layer
                  opacity: 1        // Make the tooltip fully opaque
                });
                layer.openTooltip(); // Display the tooltip immediately upon click
                if (selectedCol1 === 'nsdoh_profiles' && selectedOverlay !== 'Bivariate Choropleth') {
                  addPlacementMarkerLegend(avgValue2, avgValue2, '.d3-legend-container3');
                }
              });
            }

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

            const val2 = Number(valuemap2.get(censusTract))

            if (profile !== undefined) {
              layer.on('click', function () {
                layer.bindTooltip(nsdohProfileToolTip, {
                  permanent: false, // Tooltip will disappear when clicking elsewhere
                  direction: 'top', // Tooltip position relative to the layer
                  opacity: 1        // Make the tooltip fully opaque
                });
                layer.openTooltip(); // Display the tooltip immediately upon click
                if (selectedCol1 === 'nsdoh_profiles' && selectedOverlay !== 'Bivariate Choropleth') {
                  addPlacementMarkerLegend(val2, val2, '.d3-legend-container3');
                }

              });

              // Optionally, add a close handler if clicking elsewhere is needed
              layer.on('mouseout', function () {
                layer.closeTooltip(); // Close the tooltip when the mouse leaves the layer
              });
            }
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

            layer.on('click', function () {
              layer.bindTooltip(countyTooltip, {
                permanent: false, // Tooltip will disappear when clicking elsewhere
                direction: 'top', // Tooltip position relative to the layer
                opacity: 1        // Make the tooltip fully opaque
              });
              layer.openTooltip(); // Display the tooltip immediately upon click

              if (selectedOverlay === 'Bivariate Choropleth') {
                addPlacementMarkerLegendBivariate(avgValue1, avgValue2, '.d3-legend-container');
              } else {
                addPlacementMarkerLegend(avgValue1, avgValue2, '.d3-legend-container2');
              }

            });

            // Optionally, add a close handler if clicking elsewhere is needed
            layer.on('mouseout', function () {
              layer.closeTooltip(); // Close the tooltip when the mouse leaves the layer
            });
          } else if (currentZoom >= 9) {
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
            // Add click event listener to show the tooltip
            layer.on('click', function () {
              layer.bindTooltip(censusTractTooltip, {
                permanent: false, // Tooltip will disappear when clicking elsewhere
                direction: 'top', // Tooltip position relative to the layer
                opacity: 1        // Make the tooltip fully opaque
              });
              layer.openTooltip(); // Display the tooltip immediately upon click

              if (selectedOverlay === 'Bivariate Choropleth') {
                addPlacementMarkerLegendBivariate(val1, val2, '.d3-legend-container');
              } else {
                addPlacementMarkerLegend(val1, val2, '.d3-legend-container2');
              }

            });

            // Optionally, add a close handler if clicking elsewhere is needed
            layer.on('mouseout', function () {
              layer.closeTooltip(); // Close the tooltip when the mouse leaves the layer
            });
          }
        }
      }
    }).addTo(this.map);

    let map = this.map

    const currBounds = map.getBounds();

    let spikeZoomAdj = {
      "5": 3 / 4,
      "6": 3 / 8,
      "7": 3 / 16,
      "8": 3 / 32
    }
    function getSpikeZoomAdj(zoom) {
      // return 2 - 0.4 * (zoom - 5);
      return 3 / Math.pow(2, zoom - 3);
    }

    function addSpike(latLng: L.LatLng, value: number) {
      const scaleValue = d3.scaleLinear().domain([min2, max2]).range([0, getSpikeZoomAdj(zoom) * 2])(value);
      const spikeHeight = scaleValue

      // const spikeHeight = scaleRadius(value) * 0.0005 * height; // Convert to map units (degrees)
      // const spikeWidth = spikeHeight / 5; // Adjust width relative to height
      const spikeWidth = getSpikeZoomAdj(zoom) / 8

      // Define the three points of the triangle (base and tip)
      const triangleCoords = [
        [latLng.lat, latLng.lng - spikeWidth], // Left base
        [latLng.lat, latLng.lng + spikeWidth], // Right base
        [latLng.lat + spikeHeight, latLng.lng] // Pointed top
      ];

      // Create the triangle using a Leaflet polygon
      const triangle = L.polygon(triangleCoords, {
        color: 'red',
        fillColor: 'tomato',
        fillOpacity: 0.75,
        weight: 1,
        pane: "spikePane"
      }).addTo(map);


    }


    //this equation comes from trial and error to see what values matches the legend size
    function getCircleMaxSize(zoomLevel) {
      return 768000 * Math.pow(2, -zoomLevel);
    }

    const zoom = map.getZoom()
    function addCircle(latLng: L.LatLng, value: number) {
      const scaleRadius = d3.scaleLinear().domain([min2, max2]).range([0, getCircleMaxSize(zoom)])(value)
      const circle = L.circle(latLng, {
        color: 'tomato',
        fillColor: 'tomato',
        fillOpacity: .5,
        opacity: 0.65,
        radius: scaleRadius,
        pane: "circlePane"
      }).addTo(map);

    }

    // function scaleRadius(value: number) {
    //   // const minValue = 100, maxValue = 2000; // Adjust based on your data
    //   return d3.scaleLinear().domain([min2, max2]).range([0, 5000])(value);
    // }

    function addPlacementMarkerLegend(val1, val2, container) {
      let container2 = `${container} svg`
      const svgLegend = d3.select(container2)

      // Check if the legend exists before modifying it
      if (!svgLegend.empty()) {
        // Remove any previously added black circle
        svgLegend.selectAll(".placementCircle").remove();
        svgLegend.selectAll(".placementSpike").remove();

        let legendWidth = 100
        let legendHeight = 75
        let separation = 20

        const circleRadius = 3; // Define circle radius
        const minX = circleRadius; // Ensures the circle isn't clipped on the left
        const maxX = legendWidth - circleRadius; // Ensures the circle isn't clipped on the right

        // Calculate raw x-position based on value scaling
        let rawX1 = (val1 / (max1 - min1)) * legendWidth;
        let rawX2 = (val2 / (max2 - min2)) * legendWidth;

        // Ensure the value stays within the allowed range
        let clampedX1 = Math.max(minX, rawX1); // Prevents going too far left
        clampedX1 = Math.min(maxX, clampedX1); // Prevents going too far right

        // Ensure the value stays within the allowed range
        let clampedX2 = Math.max(minX, rawX2); // Prevents going too far left
        clampedX2 = Math.min(maxX, clampedX2); // Prevents going too far right

        if (selectedCol1 !== 'nsdoh_profiles') {
          svgLegend.append("circle")
            .attr("class", "placementCircle")
            .attr("cx", clampedX1)  // Middle of the rectangle 
            .attr("cy", legendHeight - 45)  // Middle of the rectangle (y + height/2)
            .attr("r", circleRadius)  // Radius of the dot
            .attr("fill", "black")  // Black color
            .attr("opacity", 0.7)
        }

        if (selectedOverlay !== "Circles" && selectedOverlay !== "Spikes") {
          svgLegend.append("circle")
            .attr("class", "placementCircle")
            .attr("cx", clampedX2)  // Middle of the rectangle 
            .attr("cy", legendHeight - 35 + separation + 15)  // Middle of the rectangle (y + height/2)
            .attr("r", circleRadius)  // Radius of the dot
            .attr("fill", "black")  // Black color
            .attr("opacity", 0.7)
        } else if (selectedOverlay === "Circles") {
          let circleVal = val2 / (max2 - min2)
          let circleIndex = Math.min(Math.floor(circleVal * 5), 4);
          const circleSizes = [0.1, 3, 5, 7, 9];
          const xSpacingValues = [5, 15, 30, 50, 75];
          svgLegend.append("circle")
            .attr("class", "placementCircle")
            .attr("cx", xSpacingValues[circleIndex])
            .attr("cy", legendHeight - 35 + separation + 20)
            .attr("r", circleSizes[circleIndex])
            .attr("fill", "tomato")
            .attr("stroke", "black")
            .attr("stroke-width", 2);

        } else if (selectedOverlay === "Spikes") {
          const spikeHeights = [1, 5, 10, 15, 20];
          const xSpacingValues = [5, 22, 42, 67, 95];
          let spikeVal = val2 / (max2 - min2)
          let spikeIndex = Math.min(Math.floor(spikeVal * 5), 4);
          const spikeWidth = spikeHeights[spikeIndex] / 5;
          const x = xSpacingValues[spikeIndex];  // x position for this spike in the legend
          const yBaseline = 85;         // Baseline y coordinate
          const triangleCoords = [
            { x: x - spikeWidth, y: yBaseline },  // Left base point
            { x: x + spikeWidth, y: yBaseline },  // Right base point
            { x: x, y: yBaseline - spikeHeights[spikeIndex] }   // Tip of the spike
          ];

          // Append a polygon representing the spike
          svgLegend.append("polygon")
            .attr("class", "placementSpike")
            .attr("points", triangleCoords.map(d => `${d.x},${d.y}`).join(" "))
            .attr("fill", "black")
            .attr("stroke", "black")
            .attr("stroke-width", 1);
        }

      } else {
        console.warn("Legend SVG not found");
      }
    }

    function addPlacementMarkerLegendBivariate(val1, val2, container) {
      let container2 = `${container} svg`
      const svgLegend = d3.select(container2)

      // Check if the legend exists before modifying it
      if (!svgLegend.empty()) {
        // Remove any previously added black circle
        svgLegend.selectAll("circle").remove();

        const squareSize = 24;
        // Normalize values between 0 and 1
        const normalize = (value: number, min: number, max: number) => (value - min) / (max - min);

        const value1 = normalize(val1, min1, max1);
        const value2 = normalize(val2, min2, max2);

        // Function to determine placement based on value
        const getPlacement = (value: number): number => {
          if (value < 0.33) return squareSize / 2;
          if (value < 0.66) return squareSize / 2 + squareSize;
          return squareSize / 2 + squareSize * 2;
        };

        const xPlacement = getPlacement(value1);
        const yPlacement = getPlacement(1 - value2);

        svgLegend.append("circle")
          .attr("cx", xPlacement)  // Middle of the rectangle 
          .attr("cy", yPlacement)  // Middle of the rectangle (y + height/2)
          .attr("r", 7)  // Radius of the dot
          .attr("fill", "black")
          .attr("opacity", 0.7)
      } else {
        console.warn("Legend SVG not found");
      }
    }

    if (selectedOverlay !== "Bivariate Choropleth" && selectedCol2 !== '--') {
      let areaLayer2 = L.geoJSON(area, {
        style: function (d) {
          // const pane = 'tractsPane';
          const fips = currentZoom < 9 ? 'STCOFIPS' : 'FIPS'
          const id = d['properties'][fips]
          let val2 = currentZoom < 9 ? (avgData2?.[id]?.['avg'] ?? -1) : valuemap2.get(id)

          // Add pattern to the map
          if (selectedOverlay === "Heatmap Overlays") {
            const dashPattern2 = new L.StripePattern({
              weight: 2, // Thickness of stripes
              color: getColor(val2, min2, max2, 'red'), // Color of stripes
              spaceColor: 'white', // Space between stripes
              opacity: 1,
              angle: 45, // Angle of stripes
            });

            dashPattern2.addTo(map);

            return {
              pane: 'dashPane',
              color: '#2a2a2a',
              weight: 1,
              fillOpacity: 1,
              fillPattern: dashPattern2,
            };
          }
        },
        onEachFeature: function (feature, layer) {
          if (currentZoom < 9) {
            let state = feature.properties.STATE_NAME
            let county = feature.properties.COUNTY
            let fips = feature.properties.STCOFIPS
            let avgValue1 = 0
            if (selectedCol1 !== 'nsdoh_profiles') {
              avgValue1 = avgData1[fips] && avgData1[fips]['avg'] ? avgData1[fips]['avg'] : 0
            }

            let avgValue2 = avgData2[fips] && avgData2[fips]['avg'] ? avgData2[fips]['avg'] : 0

            let countyTooltip = `
            <strong> State:</strong> ${state || 'N/A'}<br>
            <strong> County:</strong> ${county || 'N/A'}<br>
            <strong> FIPS:</strong> ${fips || 'N/A'}<br>
            <strong> ${selectedCol1}:</strong> ${avgValue1.toFixed(2) || 'N/A'}<br>
            <strong> ${selectedCol2}:</strong> ${avgValue2.toFixed(2) || 'N/A'}<br>
          `;

            layer.on('click', function () {
              this.clickVal1 = avgValue1
              this.clickVal2 = avgValue2
              layer.bindTooltip(countyTooltip, {
                permanent: false, // Tooltip will disappear when clicking elsewhere
                direction: 'top', // Tooltip position relative to the layer
                opacity: 1        // Make the tooltip fully opaque
              });
              layer.openTooltip(); // Display the tooltip immediately upon click

              if (selectedCol1 === 'nsdoh_profiles' && selectedOverlay === 'Heatmap Overlays') {
                addPlacementMarkerLegend(avgValue1, avgValue2, '.d3-legend-container3');
              } else {
                addPlacementMarkerLegend(avgValue1, avgValue2, '.d3-legend-container2');
              }

            });

            // Optionally, add a close handler if clicking elsewhere is needed
            layer.on('mouseout', function () {
              layer.closeTooltip(); // Close the tooltip when the mouse leaves the layer
            });

            let profile = avgDataCarmen[fips] !== undefined ? avgDataCarmen[fips]['mostFreq'] : "N/A";

            if ((selectedCol1 === 'nsdoh_profiles' && profile !== 'N/A') || selectedCol1 !== 'nsdoh_profiles') {
              const latLng = layer.getBounds().getCenter();
              if (currBounds.contains(latLng)) {
                if (selectedOverlay === "Circles") {
                  addCircle(latLng, avgValue2);
                } else if (selectedOverlay === "Spikes") {
                  addSpike(latLng, avgValue2);
                }
              }
            }


          } else if (currentZoom >= 9) {
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
            layer.on('click', function () {
              layer.bindTooltip(censusTractTooltip, {
                permanent: false, // Tooltip will disappear when clicking elsewhere
                direction: 'top', // Tooltip position relative to the layer
                opacity: 1        // Make the tooltip fully opaque
              });
              layer.openTooltip(); // Display the tooltip immediately upon click

              // addPlacementMarkerLegend(val1, val2, '.d3-legend-container2');
              if (selectedCol1 === 'nsdoh_profiles' && selectedOverlay === 'Heatmap Overlays') {
                addPlacementMarkerLegend(val1, val2, '.d3-legend-container3');
              } else {
                addPlacementMarkerLegend(val1, val2, '.d3-legend-container2');
              }
            });

            if ((selectedCol1 === 'nsdoh_profiles' && valuemapCarmen.get(fips) !== undefined) || selectedCol1 !== 'nsdoh_profiles') {
              const latLng = layer.getBounds().getCenter();
              if (currBounds.contains(latLng)) {
                if (selectedOverlay === "Circles") {
                  addCircle(latLng, val2);
                } else if (selectedOverlay === "Spikes") {
                  addSpike(latLng, val2);
                }
              }

            }

            // Optionally, add a close handler if clicking elsewhere is needed
            layer.on('mouseout', function () {
              layer.closeTooltip(); // Close the tooltip when the mouse leaves the layer
            });

          }
        }
      }).addTo(this.map);

    }

    this.map.on("zoomstart", () => {
      this.previousZoomLevel = this.map.getZoom(); // Store previous zoom level at start of zoom
    });

    this.map.on('zoomend', () => {
      this.currentZoomLevel = this.map.getZoom();
      if (this.currentZoomLevel >= 9 && this.currentZoomLevel > this.previousZoomLevel) {
        const bounds = this.map.getBounds();
        this.currentBounds = [bounds.getSouthWest(), bounds.getNorthEast()]
        this.currentCensusTractsMapArr = this.findIntersectingTiles(this.currentBounds)
        this.useNewMap = true
        this.loadAndInitializeMap()
      } else if (this.currentZoomLevel < 9) {
        const bounds = this.map.getBounds();
        this.currentBounds = [bounds.getSouthWest(), bounds.getNorthEast()]
        this.loadAndInitializeMap()
      }
      else {
        this.useNewMap = true
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
      } else {
        const bounds = this.map.getBounds();
        this.currentBounds = [bounds.getSouthWest(), bounds.getNorthEast()]
        this.loadAndInitializeMap()
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
  legendControl2

  addD3Legend(): void {
    if (this.legendControl) {
      this.map.removeControl(this.legendControl);
      delete this.legendControl
    }
    if (this.legendControl2) {
      this.map.removeControl(this.legendControl2);
      delete this.legendControl2
    }

    this.legendControl = L.control({ position: 'bottomright' });

    this.legendControl.onAdd = () => {
      const div = this.selectedOverlay === "Bivariate Choropleth" ? L.DomUtil.create('div', 'd3-legend-container') : L.DomUtil.create('div', 'd3-legend-container2')
      this.createD3Legend(div, '1');

      return div;
    };

    this.legendControl.addTo(this.map);

    if (this.selectedCol1 === 'nsdoh_profiles' && this.selectedCol2 !== '--') {
      this.legendControl2 = L.control({ position: 'bottomright' });

      this.legendControl2.onAdd = () => {
        const div = L.DomUtil.create('div', 'd3-legend-container3')
        this.createD3Legend(div, '2');

        return div;
      };

      this.legendControl2.addTo(this.map);
    }
  }

  createD3Legend(container: HTMLElement, legendNumber: string): void {
    let bivariateViewBox = [-15, -15, 100, 100]
    let heatmapViewBox = [0, 0, 100, 100]
    let nsdoh_mix = [0, 40, 100, 50]
    const svgLegend = d3
      .select(container)
      .append("svg")
      .attr("width", 80)
      .attr("height", this.selectedCol1 === 'nsdoh_profiles' ? (legendNumber === '2' ? 40 : 120) : 80)
      .attr("viewBox", this.selectedOverlay === "Bivariate Choropleth" ? bivariateViewBox : (this.selectedCol1 === 'nsdoh_profiles' && legendNumber === '2' ? nsdoh_mix : heatmapViewBox))

    if (this.selectedOverlay === "Bivariate Choropleth") {
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
      if (this.selectedCol1 === 'nsdoh_profiles' && legendNumber === '1') {
        //NSDOH profiles legend
        const color2 = d3.scaleOrdinal()
          .domain(this.colorCategories)
          .range(d3.schemeSet3);

        svgLegend
          .append("text")
          .attr('class', 'legend-title')
          .attr("x", 0)
          .attr("y", -5)
          .text(`NSDOH Profiles`)

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

      } else if (legendNumber === '2' && this.selectedCol1 !== 'nsdoh_profiles') {
        if ((this.selectedOverlay === 'Circles' || this.selectedOverlay === 'Spikes' || (this.selectedOverlay === 'Heatmap Overlays' && this.selectedCol1 === 'nsdoh_profiles'))) {
          let legendWidth = 100
          let legendHeight = 75
          let separation = 20
          const legendGroup = svgLegend.append('g')
            .attr('font-family', 'sans-serif')
            .attr('font-size', 10)
          if (this.selectedCol2 !== '--') {
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
        }
      } else {
        let legendWidth = 100
        let legendHeight = 75
        let separation = 20
        const legendGroup = svgLegend.append('g')
          .attr('font-family', 'sans-serif')
          .attr('font-size', 10)
        if (this.selectedCol1 !== '--' && (this.selectedCol1 !== 'nsdoh_profiles')) {
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
            .attr("class", "legend-gradient")
            .attr("x", 5)
            .attr("y", legendHeight - 50)
            .attr("width", legendWidth)
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
            .attr("class", "legend-min")
            .attr("x", 0)
            .attr("y", legendHeight - 55 + 25)
            .attr("text-anchor", "start")
            .attr("font-size", 8)
            .text(`${Math.floor(this.min1 * 10) / 10}`);

          svgLegend.append("text")
            .attr("class", "legend-max")
            .attr("x", legendWidth)
            .attr("y", legendHeight - 55 + 25)
            .attr("text-anchor", "end")
            .attr("font-size", 8)
            .text(`${Math.ceil(this.max1 * 10) / 10}`);
        }


        if (this.selectedCol2 !== '--') {
          if (this.selectedOverlay !== 'Circles' && this.selectedOverlay !== 'Spikes') {
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
          } else if (this.selectedOverlay === 'Circles') {
            const legendGroup = svgLegend.append("g")
              .attr("transform", "translate(0, 50)");

            const circleSizes = [0.1, 3, 5, 7, 9];
            const xSpacingValues = [5, 15, 30, 50, 75];
            const diff = (this.max2 - this.min2) / 4
            const circleValues = [this.min2, this.max2]

            legendGroup.append("text")
              .attr("x", 0)
              .attr("y", 15)
              .attr("text-anchor", "start")
              .attr("font-size", 8)
              .attr("font-weight", "bold")
              .text(`${this.selectedCol2 !== '--' ? `${this.selectedCol2.charAt(0).toUpperCase()}${this.selectedCol2.slice(1)}` : 'Column 2'}`)

            circleSizes.forEach((size, i) => {
              legendGroup.append("circle")
                .attr("cx", xSpacingValues[i])
                .attr("cy", 30)
                .attr("r", size)
                .attr("fill", "tomato")
                .attr("stroke", "red")
                .attr("stroke-width", 1);
            });

            legendGroup.append("text")
              .attr("x", xSpacingValues[0])
              .attr("y", 50)
              .attr("text-anchor", "middle")
              .attr("font-size", 8)
              .text(`${circleValues[0]}`);

            legendGroup.append("text")
              .attr("x", xSpacingValues[4])
              .attr("y", 50)
              .attr("text-anchor", "middle")
              .attr("font-size", 8)
              .text(`${circleValues[1].toFixed(1)}`);
          } else if (this.selectedOverlay === 'Spikes') {
            const legendGroup = svgLegend.append("g")
              .attr("transform", "translate(0, 35)");

            legendGroup.append("text")
              .attr("x", 0)
              .attr("y", 25)
              .attr("text-anchor", "start")
              .attr("font-size", 8)
              .attr("font-weight", "bold")
              .text(`${this.selectedCol2 !== '--' ? `${this.selectedCol2.charAt(0).toUpperCase()}${this.selectedCol2.slice(1)}` : 'Column 2'}`);

            const spikeHeights = [1, 5, 10, 15, 20];
            const xSpacingValues = [5, 22, 42, 67, 95];
            const spikeValues = [this.min2, this.max2]; // Min & Max values

            spikeHeights.forEach((h, i) => {
              const spikeWidth = h / 5;
              const x = xSpacingValues[i];  // x position for this spike in the legend
              const yBaseline = 50;         // Baseline y coordinate
              const triangleCoords = [
                { x: x - spikeWidth, y: yBaseline },  // Left base point
                { x: x + spikeWidth, y: yBaseline },  // Right base point
                { x: x, y: yBaseline - h }   // Tip of the spike
              ];

              // Append a polygon representing the spike
              legendGroup.append("polygon")
                .attr("points", triangleCoords.map(d => `${d.x},${d.y}`).join(" "))
                .attr("fill", "tomato")
                .attr("stroke", "red")
                .attr("stroke-width", 1);
            });

            // // Min Value Label
            legendGroup.append("text")
              .attr("x", xSpacingValues[0] + 2)
              .attr("y", 65)
              .attr("text-anchor", "middle")
              .attr("font-size", 8)
              .text(`${spikeValues[0].toFixed(1)}`);

            // Max Value Label
            legendGroup.append("text")
              .attr("x", xSpacingValues[4])
              .attr("y", 65)
              .attr("text-anchor", "middle")
              .attr("font-size", 8)
              .text(`${spikeValues[1].toFixed(1)}`);
          }
        }
      }

    }
  }

}
