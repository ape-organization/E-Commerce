import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllBrands } from './all-brands';

describe('AllBrands', () => {
  let component: AllBrands;
  let fixture: ComponentFixture<AllBrands>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllBrands]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllBrands);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
