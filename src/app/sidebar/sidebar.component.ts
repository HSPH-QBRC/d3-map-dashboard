import { Component, AfterViewInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
declare var bootstrap: any;

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnChanges {
  @Input() dataFromCountyMap!: { years: string[], columns: string[], maps: string[] }; // Data received from the county map
  @Output() dataToCountyMap = new EventEmitter<{ selectedCounty: string; details: string }>(); // Data sent to the county map


  yearCols = [];
  mapsCols = [];
  columns = [];
  selectedYear = '2017'

  ngOnChanges(changes: SimpleChanges): void {
    if (this.dataFromCountyMap) {
      console.log('Received data from County Map:', this.dataFromCountyMap);
      this.createCheckboxes()
    }
  }

  createCheckboxes() {
    for (let category in this.dataFromCountyMap) {
      // console.log(this.dataFromCountyMap[category])
      for (let data of this.dataFromCountyMap[category]) {
        let temp = {
          name: data,
          checked: false
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

    console.log("maps: ", this.mapsCols)
  }

  sendData() {
    const selectedData = {
      selectedCounty: 'County A',
      details: 'Sidebar-selected county details'
    };
    this.dataToCountyMap.emit(selectedData); // Emit data to the county map
  }

}
