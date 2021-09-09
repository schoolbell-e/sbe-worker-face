import { TestBed } from '@angular/core/testing';

import { SelectFacesModalService } from './select-faces-modal.service';

describe('SelectFacesModalService', () => {
  let service: SelectFacesModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SelectFacesModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
