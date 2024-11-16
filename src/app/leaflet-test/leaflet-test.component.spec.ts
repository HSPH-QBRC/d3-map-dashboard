import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeafletTestComponent } from './leaflet-test.component';

describe('LeafletTestComponent', () => {
  let component: LeafletTestComponent;
  let fixture: ComponentFixture<LeafletTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LeafletTestComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LeafletTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
