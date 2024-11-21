import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { MatSlider } from '@angular/material/slider';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnChanges {
  @Input() sidebarData!: { years: string[], columns: string[], maps: string[] }; // Data received from the county map
  @Output() dataToCountyMap = new EventEmitter<{ selectedCounty: string; details: string }>(); // Data sent to the county map
  @ViewChild('slider') slider: MatSlider; // Reference to the slider

  yearCols = [];
  mapsCols = [];
  columns = [];
  selectedYear = '2000'
  selectedMap = ''
  selectedCol1 = ''
  selectedCol2 = ''
  selectedCol3 = ''

  ngOnChanges(changes: SimpleChanges): void {
    if (this.sidebarData) {
      console.log('Received data from County Map:', this.sidebarData);
      this.selectedYear = this.sidebarData['selectedYear']
      this.selectedMap = this.sidebarData['selectedMap']
      this.selectedCol1 = this.sidebarData['selectedCol'][0]
      this.selectedCol2 = this.sidebarData['selectedCol'][1]
      this.selectedCol3 = this.sidebarData['selectedCol'][2]
      this.createCheckboxes()
    }
  }

  createCheckboxes() {
    for (let category in this.sidebarData) {
      for (let data of this.sidebarData[category]) {
        let temp = {
          name: data,
          checked: (data === this.selectedMap && category === 'maps') || ((data === this.selectedCol1 || data === this.selectedCol2 || data === this.selectedCol3) && category === 'columns') ? true : false
        }

        if (category === 'years') {
          this.yearCols.push(temp)
        } else if (category === 'maps') {
          this.mapsCols.push(temp)
        } else if (category === 'columns') {
          this.columns.push(temp)
        }
      }
    }
  }

  sendData() {
    const selectedData = {
      selectedCounty: 'County A',
      details: 'Sidebar-selected county details'
    };
    this.dataToCountyMap.emit(selectedData); // Emit data to the county map
  }

}
