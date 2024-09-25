import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TilesMapComponent } from './tiles-map.component';

describe('TilesMapComponent', () => {
  let component: TilesMapComponent;
  let fixture: ComponentFixture<TilesMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TilesMapComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TilesMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
