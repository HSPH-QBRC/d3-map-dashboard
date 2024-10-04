import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TileTestComponent } from './tile-test.component';

describe('TileTestComponent', () => {
  let component: TileTestComponent;
  let fixture: ComponentFixture<TileTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TileTestComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TileTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
