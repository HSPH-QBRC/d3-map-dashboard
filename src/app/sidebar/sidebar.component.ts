import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, OnInit } from '@angular/core';
import { MatSlider } from '@angular/material/slider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnChanges, OnInit {
  @Input() sidebarData!: { years: string[], columns: string[], maps: string[] };
  @ViewChild('slider') slider: MatSlider;
  @Output() dataToParent = new EventEmitter<any>();
  @Output() dataToParentStateNameOnly = new EventEmitter<any>();

  constructor(
    private snackBar: MatSnackBar,
    private http: HttpClient,
  ) { }

  isLoading = true;
  yearCols = [];
  columnsA = [];
  columnsB = [];
  selectedYear = '2000'
  selectedCol1 = ''
  selectedCol2 = ''
  selectedCol3 = ''
  stateName = ''

  prevYear = '2000'
  prevCol1 = ''
  prevCol2 = ''
  prevCol3 = ''
  prevStateName = ''
  prevUseBivariate = true

  showYears = false
  showColsA = false
  showColsB = false

  minYear = Infinity
  maxYear = -Infinity

  showMoreColsA = false
  showMoreColsB = false

  useBivariate: boolean = true
  useDashOverlay: boolean = false
  useSpike: boolean = false

  groceryDataDictionary = {}

  ngOnInit(): void {
    this.http.get('/assets/data/groceryDataDictionary.json').subscribe((data) => {
      this.groceryDataDictionary = data
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.keys(this.sidebarData['years']).length > 0) {
      this.isLoading = false
      this.showYears = false
      this.showColsA = false
      this.showColsB = false

      this.selectedYear = this.sidebarData['selectedYear']
      this.selectedCol1 = this.sidebarData['selectedCol'][0]
      this.selectedCol2 = this.sidebarData['selectedCol'][1]
      this.selectedCol3 = this.sidebarData['selectedCol'][2]
      this.stateName = this.sidebarData['stateName']

      this.prevYear = this.sidebarData['selectedYear']
      this.prevCol1 = this.sidebarData['selectedCol'][0]
      this.prevCol2 = this.sidebarData['selectedCol'][1]
      this.prevCol3 = this.sidebarData['selectedCol'][2]
      this.prevStateName = this.sidebarData['stateName']

      this.useBivariate = this.sidebarData['useBivariate']
      this.useDashOverlay = this.sidebarData['useDashOverlay']
      this.useSpike = this.sidebarData['useSpike']

      this.organizeData()
    }
  }

  organizeData() {
    this.columnsA = []
    this.columnsB = []
    let tempArrColsA = []
    let tempArrColsB = []
    for (let category in this.sidebarData) {
      if (category === 'columnsA') {
        for (let data of this.sidebarData[category]) {
          let checkboxObj = {
            name: data,
            checked: (data === this.selectedCol1 || data === this.selectedCol2 || data === this.selectedCol3) ? true : false
          }
          if (this.selectedCol1 === data) {
            tempArrColsA[0] = checkboxObj
          } else if (this.selectedCol2 === data) {
            tempArrColsA[1] = checkboxObj
          }
          else if (this.selectedCol3 === data) {
            tempArrColsA[2] = checkboxObj
          } else {
            this.columnsA.push(checkboxObj)
          }

        }
        let combinedArr = [...tempArrColsA, ...this.columnsA]
        this.columnsA = combinedArr
      } else if (category === 'columnsB') {
        for (let data of this.sidebarData[category]) {
          let checkboxObj = {
            name: data,
            checked: (data === this.selectedCol1 || data === this.selectedCol2 || data === this.selectedCol3) ? true : false
          }
          if (this.selectedCol1 === data) {
            tempArrColsB[0] = checkboxObj
          } else if (this.selectedCol2 === data) {
            tempArrColsB[1] = checkboxObj
          }
          else if (this.selectedCol3 === data) {
            tempArrColsB[2] = checkboxObj
          } else {
            this.columnsB.push(checkboxObj)
          }

        }
        let combinedArr = [...tempArrColsB, ...this.columnsB]
        this.columnsB = combinedArr
      } else if (category === 'years') {
        for (let year of this.sidebarData[category]) {
          let numYear = Number(year)
          this.minYear = Math.min(numYear, this.minYear)
          this.maxYear = Math.max(numYear, this.maxYear)
        }
      }
    }
    this.showYears = true
    this.showColsA = true
    this.showColsB = true
  }

  sendData() {
    if (this.selectedCol1 === "--") {
      let message = 'Please select at least 1 column.'
      this.onErrorSnackbar(message)
    } else if ((this.selectedCol1 === "nsdoh_profiles" && this.useBivariate === true)) {
      let message = 'NSDOH Profiles currently only works on Heatmap Overlays. Please change this to continue.'
      this.onErrorSnackbar(message)
    } else if ((this.selectedCol1 === "--" || this.selectedCol2 === "--") && this.useBivariate === true) {
      let message = 'In order to display Bivariate plot, you must select 2 columns.'
      this.onErrorSnackbar(message)
    } else {
      const data = {
        years: this.selectedYear.toString(),
        col1: this.selectedCol1,
        col2: this.selectedCol2,
        col3: this.selectedCol3,
        useBivariate: this.useBivariate,
        useDashOverlay: this.useDashOverlay,
        useSpike: this.useSpike,
        stateName: this.stateName
      }
      this.showMoreColsA = false;
      this.showMoreColsB = false;

      if (this.useBivariate === this.prevUseBivariate && this.selectedYear === this.prevYear && this.selectedCol1 === this.prevCol1 && this.selectedCol2 === this.prevCol2 && this.selectedCol3 === this.prevCol3 && this.stateName !== this.prevStateName) {
        this.http.get('/assets/maps/tiles_no_redline/boundsDict.json').subscribe((boundsData) => {
          if (boundsData[this.stateName]) {
            this.dataToParentStateNameOnly.emit(this.stateName)
          } else {
            let message = 'Could not find this location. Did you spell the State name correctly?'
            this.onErrorSnackbar(message)
          }
        });

      } else {
        this.dataToParent.emit(data);
      }
    }
  }

  showMore(name) {
    if (name === 'colsA') {
      this.showMoreColsA = !this.showMoreColsA
    } else if (name === 'colsB') {
      this.showMoreColsB = !this.showMoreColsB
    }
  }

  onChangeOverlay(type) {
    if(type === 'bivariate'){
      this.useBivariate = !this.useBivariate
      if(this.useBivariate){
        this.useDashOverlay = false
        this.useSpike = false
      }else{
        this.useSpike = true
      }
    }else if(type === 'dash'){
      this.useDashOverlay = !this.useDashOverlay
      if(this.useDashOverlay){
        this.useBivariate = false
        this.useSpike = false
      }else{
        this.useBivariate = true
      }
    }else if (type === 'spike'){
      this.useSpike = !this.useSpike
      if(this.useSpike){
        this.useBivariate = false
        this.useDashOverlay = false
      }else {
        this.useBivariate = true
      }
    }

    const data = {
      years: this.selectedYear.toString(),
      col1: this.selectedCol1,
      col2: this.selectedCol2,
      col3: this.selectedCol3,
      useBivariate: this.useBivariate,
      useDashOverlay: this.useDashOverlay,
      useSpike: this.useSpike,
      stateName: this.stateName
    }

    this.dataToParent.emit(data);
  }

  onCheckboxChange(index, isCheck, name) {
    if (isCheck && this.selectedCol1 !== "--" && this.selectedCol2 !== "--" && this.selectedCol3 !== "--" && name !== 'nsdoh_profiles') {
      let message = 'Currently we are only able to display 3 columns max right now'
      this.onErrorSnackbar(message)
    }

    if ((name === 'nsdoh_profiles' && isCheck) || (this.selectedCol1 === 'nsdoh_profiles' && name !== 'nsdoh_profiles' && isCheck)) {
      this.selectedCol1 = name
      this.selectedCol2 = "--"
      this.selectedCol3 = "--"
    }
    else if (isCheck) {
      if (this.selectedCol1 === "--") {
        this.selectedCol1 = name
      } else if (this.selectedCol2 === "--") {
        this.selectedCol2 = name
      } else if (this.selectedCol3 === "--") {
        this.selectedCol3 = name
      }
    } else if (!isCheck) {
      if (index === 0) {
        this.selectedCol1 = this.selectedCol2
        this.selectedCol2 = this.selectedCol3
        this.selectedCol3 = "--"
      } else if (index === 1) {
        this.selectedCol2 = this.selectedCol3
        this.selectedCol3 = "--"
      } else if (index === 2) {
        this.selectedCol3 = "--"
      }
    }
    // else if (index === 0) {
    //   if (isCheck === true) {
    //     this.selectedCol1 = name
    //   } else {
    //     if (this.selectedCol2 !== "--") {
    //       this.selectedCol1 = this.selectedCol2
    //       this.selectedCol2 = this.selectedCol3
    //       this.selectedCol3 = "--"
    //     } else {
    //       this.selectedCol1 = "--"
    //     }
    //   }
    // } else if (index === 1) {
    //   if (isCheck === true) {
    //     this.selectedCol2 = name
    //   } else {
    //     if (this.selectedCol3 !== "--") {
    //       this.selectedCol2 = this.selectedCol3
    //       this.selectedCol3 = "--"
    //     } else {
    //       this.selectedCol2 = "--"
    //     }

    //   }
    // } else if (index === 2) {
    //   if (isCheck === true) {
    //     this.selectedCol3 = name
    //   } else {
    //     this.selectedCol3 = "--"
    //   }
    // } else {
    //   if (isCheck === true) {
    //     if (this.selectedCol1 === "--") {
    //       this.selectedCol1 = name
    //     } else if (this.selectedCol2 === "--") {
    //       this.selectedCol2 = name
    //     } else if (this.selectedCol3 === "--") {
    //       this.selectedCol3 = name
    //     }
    //   }
    // }
    console.log("selected: ", this.selectedCol1, this.selectedCol2, this.selectedCol3)
    this.organizeData()
  }

  onErrorSnackbar(message): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'left',
      verticalPosition: 'bottom',
    });
  }
}
