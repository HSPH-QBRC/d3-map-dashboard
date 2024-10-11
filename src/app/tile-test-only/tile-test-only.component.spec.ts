import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TileTestOnlyComponent } from './tile-test-only.component';

describe('TileTestOnlyComponent', () => {
  let component: TileTestOnlyComponent;
  let fixture: ComponentFixture<TileTestOnlyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TileTestOnlyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TileTestOnlyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
