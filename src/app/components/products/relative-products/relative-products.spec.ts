import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelativeProducts } from './relative-products';

describe('RelativeProducts', () => {
  let component: RelativeProducts;
  let fixture: ComponentFixture<RelativeProducts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelativeProducts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RelativeProducts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
