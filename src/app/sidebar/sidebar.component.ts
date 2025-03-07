import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, OnInit, ElementRef, AfterViewInit } from '@angular/core';
import { MatSlider } from '@angular/material/slider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MatChipInputEvent } from '@angular/material/chips';
import { ENTER } from '@angular/cdk/keycodes';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
// import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnChanges, OnInit, AfterViewInit {
  @Input() sidebarData!: { years: string[], columns: string[], maps: string[] };
  @ViewChild('slider') slider: MatSlider;
  @ViewChild('inputField') inputField!: ElementRef<HTMLInputElement>;
  @Output() dataToParent = new EventEmitter<any>();
  @Output() dataToParentStateNameOnly = new EventEmitter<any>();

  filteredStates: Observable<string[]>;

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
  stateNameArr = []

  prevYear = '2000'
  prevCol1 = ''
  prevCol2 = ''
  prevStateName = []
  prevUseBivariate = true

  showYears = false
  showColsA = false
  showColsB = false

  minYear = Infinity
  maxYear = -Infinity

  showMoreColsA = false
  showMoreColsB = false

  groceryDataDictionary = {}

  selectedOverlay = "Bivariate Choropleth"
  overlays = ["Bivariate Choropleth", "Heatmap Overlays", "Circles", "Spikes"]

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
      this.stateNameArr = this.sidebarData['stateName']

      this.prevYear = this.sidebarData['selectedYear']
      this.prevCol1 = this.sidebarData['selectedCol'][0]
      this.prevCol2 = this.sidebarData['selectedCol'][1]
      this.prevStateName = this.sidebarData['stateName']

      this.selectedOverlay = this.sidebarData['selectedOverlay']

      this.organizeData()
    }
  }

  ngAfterViewInit() {
    // Ensure the input element exists before focusing
    // if (this.inputField) {
    //   this.inputField.nativeElement.focus();
    // }
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
            checked: (data === this.selectedCol1 || data === this.selectedCol2) ? true : false
          }

          if (this.selectedCol1 === data) {
            tempArrColsA[0] = checkboxObj
          } else if (this.selectedCol2 === data) {
            if (this.selectedCol1 === 'nsdoh_profiles') {
              tempArrColsA[0] = checkboxObj
            } else {
              tempArrColsA[1] = checkboxObj
            }

          } else {
            this.columnsA.push(checkboxObj)
          }
        }
        let combinedArr = [...tempArrColsA, ...this.columnsA]
        this.columnsA = combinedArr
      }
      else if (category === 'columnsB') {
        for (let data of this.sidebarData[category]) {
          let checkboxObj = {
            name: data,
            checked: (data === this.selectedCol1 || data === this.selectedCol2) ? true : false
          }
          if (this.selectedCol1 === data || this.selectedCol2 === data) {
            tempArrColsB[0] = checkboxObj
          } else {
            this.columnsB.push(checkboxObj)
          }

        }
        let combinedArr = [...tempArrColsB, ...this.columnsB]
        this.columnsB = combinedArr
      }
      else if (category === 'years') {
        for (let year of this.sidebarData[category]) {
          let numYear = Number(year)
          this.minYear = Math.min(numYear, this.minYear)
          this.maxYear = Math.max(numYear, this.maxYear)
        }
      }
    }

    if (this.selectedCol1 === 'nsdoh_profiles' || this.selectedCol2 === 'nsdoh_profiles') {
      if (this.selectedOverlay === 'Bivariate Choropleth') {
        this.selectedOverlay = this.selectedCol2 !== '--' ? 'Circles' : 'Heatmap Overlays';
      }

      if (this.selectedCol2 === 'nsdoh_profiles') {
        let temp = this.selectedCol1
        this.selectedCol1 = this.selectedCol2
        this.selectedCol2 = temp
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
    }
    else if ((this.selectedCol1 === "--" || this.selectedCol2 === "--") && this.selectedOverlay === "Bivariate Choropleth") {
      let message = 'In order to display Bivariate plot, you must select 2 columns.'
      this.onErrorSnackbar(message)
    } else {
      const data = {
        years: this.selectedYear.toString(),
        col1: this.selectedCol1,
        col2: this.selectedCol2,
        stateName: this.stateNameArr,
        selectedOverlay: this.selectedOverlay
      }
      this.showMoreColsA = false;
      this.showMoreColsB = false;

      if (this.selectedYear === this.prevYear && this.selectedCol1 === this.prevCol1 && this.selectedCol2 === this.prevCol2 && this.stateNameArr !== this.prevStateName) {
        this.http.get('/assets/maps/tiles_no_redline/boundsDict.json').subscribe((boundsData) => {

          if (boundsData[this.stateNameArr[0]]) {
            this.dataToParentStateNameOnly.emit(this.stateNameArr)
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

  onChangeOverlay() {

    const data = {
      years: this.selectedYear.toString(),
      col1: this.selectedCol1,
      col2: this.selectedCol2,
      stateName: this.stateNameArr,
      selectedOverlay: this.selectedOverlay
    }

    this.dataToParent.emit(data);
  }

  onCheckboxChange(index, isCheck, name) {
    if (isCheck && this.selectedCol1 !== "--" && this.selectedCol2 !== "--") {
      let message = 'Currently we are only able to display 2 columns max right now'
      this.onErrorSnackbar(message)
    }

    if (isCheck) {
      if (this.selectedCol1 === "--") {
        this.selectedCol1 = name
      } else if (this.selectedCol2 === "--") {
        this.selectedCol2 = name
      }
    } else if (!isCheck) {
      if (index === 0) {
        this.selectedCol1 = this.selectedCol2
        this.selectedCol2 = '--'
      } else if (index === 1) {
        this.selectedCol2 = '--'
      }
    }
    this.organizeData()
  }

  onErrorSnackbar(message): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'left',
      verticalPosition: 'bottom',
    });
  }

  // downloadImage(){
  //   this.downloadImageEmitter.emit()
  // }

  // shareLink() {
  //   this.shareLinkEmitter.emit()
  // }

  separatorKeysCodes: number[] = [ENTER];
  // selectedFocusStates: string[] = [];

  addState(event: MatChipInputEvent): void {

    const value = (event.value || '').trim();

    this.http.get('/assets/maps/tiles_no_redline/boundsDict.json').subscribe((boundsData) => {
      if (!boundsData[value] && value !== '') {
        let message = `"${value}" not found. Please enter a valid state name or abbreviation.`
        this.onErrorSnackbar(message)
      } else {
        if (value) {
          this.stateNameArr.push(value);
        }
        this.sendData()
      }
    })

    event.chipInput!.clear();
  }


  removeState(index: number): void {
    if (index >= 0) {
      this.stateNameArr.splice(index, 1);
    }
  }

  stateCtrl = new FormControl('');
}
