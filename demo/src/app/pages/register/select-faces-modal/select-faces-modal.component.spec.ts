import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectFacesModalComponent } from './select-faces-modal.component';

describe('SelectFacesModalComponent', () => {
  let component: SelectFacesModalComponent;
  let fixture: ComponentFixture<SelectFacesModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectFacesModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectFacesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
