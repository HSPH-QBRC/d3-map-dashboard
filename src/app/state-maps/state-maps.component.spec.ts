import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StateMapsComponent } from './state-maps.component';

describe('StateMapsComponent', () => {
  let component: StateMapsComponent;
  let fixture: ComponentFixture<StateMapsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StateMapsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StateMapsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
