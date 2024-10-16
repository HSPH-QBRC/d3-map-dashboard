import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  zoomScale = 1

  handleZoomData(data: string) {
    this.zoomScale = Number(data)
  }
}
