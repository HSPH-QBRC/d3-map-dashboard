import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeafletMapLambdaApiComponent } from './leaflet-map-lambda-api.component';

describe('LeafletMapLambdaApiComponent', () => {
  let component: LeafletMapLambdaApiComponent;
  let fixture: ComponentFixture<LeafletMapLambdaApiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LeafletMapLambdaApiComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LeafletMapLambdaApiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
