import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { MatSlider } from '@angular/material/slider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnChanges {
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
  // mapsCols = [];
  columns = [];
  selectedYear = '2000'
  // selectedMap = ''
  selectedCol1 = ''
  selectedCol2 = ''
  selectedCol3 = ''
  stateName = ''

  prevYear = '2000'
  // prevMap = ''
  prevCol1 = ''
  prevCol2 = ''
  prevCol3 = ''
  prevStateName = ''
  prevUseBivariate = true

  showYears = false
  showCols = false
  // showMaps = false

  minYear = Infinity
  maxYear = -Infinity

  showMoreCols = false
  // showMoreMaps = false

  useBivariate: boolean = true
  // showRedline:boolean = false

  ngOnChanges(changes: SimpleChanges): void {
    console.log("check to see when this is updated on side")
    if (Object.keys(this.sidebarData['years']).length > 0) {
      this.isLoading = false
      this.showYears = false
      this.showCols = false
      // this.showMaps = false

      this.selectedYear = this.sidebarData['selectedYear']
      // this.selectedMap = this.sidebarData['selectedMap']
      this.selectedCol1 = this.sidebarData['selectedCol'][0]
      this.selectedCol2 = this.sidebarData['selectedCol'][1]
      this.selectedCol3 = this.sidebarData['selectedCol'][2]
      this.stateName = this.sidebarData['stateName']

      this.prevYear = this.sidebarData['selectedYear']
      // this.prevMap = this.sidebarData['selectedMap']
      this.prevCol1 = this.sidebarData['selectedCol'][0]
      this.prevCol2 = this.sidebarData['selectedCol'][1]
      this.prevCol3 = this.sidebarData['selectedCol'][2]
      this.prevStateName = this.sidebarData['stateName']

      this.organizeData()
    }
  }

  organizeData() {
    // this.mapsCols = []
    this.columns = []
    let tempArrCols = []
    for (let category in this.sidebarData) {
      if (category === 'columns') {
        for (let data of this.sidebarData[category]) {
          let checkboxObj = {
            name: data,
            checked: (data === this.selectedCol1 || data === this.selectedCol2 || data === this.selectedCol3) ? true : false
          }
          if (this.selectedCol1 === data) {
            tempArrCols[0] = checkboxObj
          } else if (this.selectedCol2 === data) {
            tempArrCols[1] = checkboxObj
          }
          else if (this.selectedCol3 === data) {
            tempArrCols[2] = checkboxObj
          } else {
            this.columns.push(checkboxObj)
          }

        }
        let combinedArr = [...tempArrCols, ...this.columns]
        this.columns = combinedArr
      } 
      // else if (category === 'maps') {
      //   this.sidebarData[category].sort((a, b) => a.localeCompare(b));
      //   for (let data of this.sidebarData[category]) {
      //     let radioObj = {
      //       name: data
      //     }

      //     if (this.selectedMap === data) {
      //       this.mapsCols.unshift(radioObj)
      //     } else {
      //       this.mapsCols.push(radioObj)
      //     }
      //   }
      // }
       else if (category === 'years') {
        for (let year of this.sidebarData[category]) {
          let numYear = Number(year)
          this.minYear = Math.min(numYear, this.minYear)
          this.maxYear = Math.max(numYear, this.maxYear)
        }
      }
    }
    this.showYears = true
    this.showCols = true
    // this.showMaps = true
  }

  sendData() {
    if (this.selectedCol1 === "--") {
      let message = 'Please select at least 1 column.'
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
        // map: this.selectedMap,
        useBivariate: this.useBivariate,
        stateName: this.stateName
        // showRedline: this.showRedline
      }
      this.showMoreCols = false;
      // this.showMoreMaps = false;


      if (this.useBivariate === this.prevUseBivariate && this.selectedYear === this.prevYear && this.selectedCol1 === this.prevCol1 && this.selectedCol2 === this.prevCol2 && this.selectedCol3 === this.prevCol3 && this.stateName !== this.prevStateName) {
        console.log("change in statename: ", this.stateName, this.prevStateName)
        this.http.get('/assets/maps/tiles_no_redline/boundsDict.json').subscribe((boundsData) => {
          console.log("bounds: ", boundsData)
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
    if (name === 'cols') {
      this.showMoreCols = !this.showMoreCols
    } 
    // else if (name === 'maps') {
    //   this.showMoreMaps = !this.showMoreMaps
    // }
  }

  onChangeBivariate() {
    this.useBivariate = !this.useBivariate
  }

  // onChangeRedline(){
  //   this.showRedline = !this.showRedline
  // }

  onCheckboxChange(index, isCheck, name) {
    if (isCheck === true && this.selectedCol1 !== "--" && this.selectedCol2 !== "--" && this.selectedCol3 !== "--") {
      let message = 'Currently we are only able to display 3 columns max right now'
      this.onErrorSnackbar(message)
    }

    if (index === 0) {
      if (isCheck === true) {
        this.selectedCol1 = name
      } else {
        if (this.selectedCol2 !== "--") {
          this.selectedCol1 = this.selectedCol2
          this.selectedCol2 = this.selectedCol3
          this.selectedCol3 = "--"
        } else {
          this.selectedCol1 = "--"
        }

      }
    }
    else if (index === 1) {
      if (isCheck === true) {
        this.selectedCol2 = name
      } else {
        if (this.selectedCol3 !== "--") {
          this.selectedCol2 = this.selectedCol3
          this.selectedCol3 = "--"
        } else {
          this.selectedCol2 = "--"
        }

      }
    }
    else if (index === 2) {
      if (isCheck === true) {
        this.selectedCol3 = name
      } else {
        this.selectedCol3 = "--"
      }
    } else {
      if (isCheck === true) {
        if (this.selectedCol1 === "--") {
          this.selectedCol1 = name
        } else if (this.selectedCol2 === "--") {
          this.selectedCol2 = name
        } else if (this.selectedCol3 === "--") {
          this.selectedCol3 = name
        }
      }
    }
    this.organizeData()

  }

  onErrorSnackbar(message): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000, // Snackbar will close after 3 seconds
      horizontalPosition: 'left',
      verticalPosition: 'bottom',
    });
  }
}
