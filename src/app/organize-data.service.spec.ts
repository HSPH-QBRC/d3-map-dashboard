import { TestBed } from '@angular/core/testing';

import { OrganizeDataService } from './organize-data.service';

describe('OrganizeDataService', () => {
  let service: OrganizeDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrganizeDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
