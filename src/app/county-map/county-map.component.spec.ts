import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CountyMapComponent } from './county-map.component';

describe('CountyMapComponent', () => {
  let component: CountyMapComponent;
  let fixture: ComponentFixture<CountyMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CountyMapComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CountyMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
