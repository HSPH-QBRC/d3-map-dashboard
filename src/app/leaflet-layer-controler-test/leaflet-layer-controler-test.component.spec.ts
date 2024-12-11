import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeafletLayerControlerTestComponent } from './leaflet-layer-controler-test.component';

describe('LeafletLayerControlerTestComponent', () => {
  let component: LeafletLayerControlerTestComponent;
  let fixture: ComponentFixture<LeafletLayerControlerTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LeafletLayerControlerTestComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LeafletLayerControlerTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
