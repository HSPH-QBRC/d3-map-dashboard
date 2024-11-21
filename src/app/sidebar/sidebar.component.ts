import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { MatSlider } from '@angular/material/slider';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnChanges {
  @Input() sidebarData!: { years: string[], columns: string[], maps: string[] }; // Data received from the county map
  // @Output() dataToCountyMap = new EventEmitter<{ selectedCounty: string; details: string }>(); // Data sent to the county map
  @ViewChild('slider') slider: MatSlider; // Reference to the slider
  @Output() dataToParent = new EventEmitter<any>();

  isLoading = true;
  yearCols = [];
  mapsCols = [];
  columns = [];
  selectedYear = '2000'
  selectedMap = ''
  selectedCol1 = ''
  selectedCol2 = ''
  selectedCol3 = ''
  showYears = false
  showCols = false
  showMaps = false

  minYear = Infinity
  maxYear = -Infinity

  showMoreCols = false
  showMoreMaps = false

  ngOnChanges(changes: SimpleChanges): void {

    if (Object.keys(this.sidebarData['years']).length > 0) {
      this.isLoading = false
      this.showYears = false
      this.showCols = false
      this.showMaps = false

      this.selectedYear = this.sidebarData['selectedYear']
      this.selectedMap = this.sidebarData['selectedMap']
      this.selectedCol1 = this.sidebarData['selectedCol'][0]
      this.selectedCol2 = this.sidebarData['selectedCol'][1]
      this.selectedCol3 = this.sidebarData['selectedCol'][2]

      this.organizeData()
    }
  }

  organizeData() {
    this.mapsCols = []
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
      } else if (category === 'maps') {
        this.sidebarData[category].sort((a, b) => a.localeCompare(b));
        for (let data of this.sidebarData[category]) {
          let radioObj = {
            name: data
          }

          if (this.selectedMap === data) {
            this.mapsCols.unshift(radioObj)
          } else {
            this.mapsCols.push(radioObj)
          }
        }
      } else if (category === 'years') {
        for (let year of this.sidebarData[category]) {
          let numYear = Number(year)
          this.minYear = Math.min(numYear, this.minYear)
          this.maxYear = Math.max(numYear, this.maxYear)
        }
      }
    }
    this.showYears = true
    this.showCols = true
    this.showMaps = true
  }

  sendData() {
    const data = {
      years: this.selectedYear.toString(),
      col1: this.selectedCol1,
      col2: this.selectedCol2,
      col3: this.selectedCol3,
      map: this.selectedMap
    }
    this.dataToParent.emit(data);
  }

  showMore(name) {
    if (name === 'cols') {
      this.showMoreCols = !this.showMoreCols
    } else if (name === 'maps') {
      this.showMoreMaps = !this.showMoreMaps
    }
  }
}
