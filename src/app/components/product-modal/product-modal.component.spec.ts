import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { ProductModalComponent } from './product-modal.component';
import { Product } from '../../models/product.model';

describe('ProductModalComponent', () => {
  let component: ProductModalComponent;
  let fixture: ComponentFixture<ProductModalComponent>;

  const mockProduct: Product = {
    id: 1,
    name: 'Test Product',
    price: 29.99,
    image: 'test-image.jpg',
    description: 'This is a test product description'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductModalComponent, CommonModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductModalComponent);
    component = fixture.componentInstance;
    component.product = mockProduct;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display product name', () => {
    fixture.detectChanges();
    const productName = fixture.nativeElement.querySelector('.product-name');
    expect(productName.textContent).toBe('Test Product');
  });

  it('should display product price', () => {
    fixture.detectChanges();
    const productPrice = fixture.nativeElement.querySelector('.product-price');
    expect(productPrice.textContent).toContain('29.99');
  });

  it('should display product description', () => {
    fixture.detectChanges();
    const descriptionText = fixture.nativeElement.querySelector('.product-description p');
    expect(descriptionText.textContent).toBe('This is a test product description');
  });

  it('should display product image with correct src and alt', () => {
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.product-image img');
    expect(img.src).toContain('test-image.jpg');
    expect(img.alt).toBe('Test Product');
  });

  it('should emit close event when close button is clicked', () => {
    spyOn(component.close, 'emit');
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('.close-btn');
    closeBtn.click();

    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should emit close event when closeModal is called', () => {
    spyOn(component.close, 'emit');
    component.closeModal();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should emit close event when overlay is clicked', () => {
    spyOn(component.close, 'emit');
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.modal-overlay');
    overlay.click();

    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should not close modal when modal content is clicked', () => {
    spyOn(component.close, 'emit');
    fixture.detectChanges();

    const modalContent = fixture.nativeElement.querySelector('.modal-content');
    modalContent.click();

    expect(component.close.emit).not.toHaveBeenCalled();
  });

  it('should have modal overlay and content elements', () => {
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.modal-overlay');
    const content = fixture.nativeElement.querySelector('.modal-content');

    expect(overlay).toBeTruthy();
    expect(content).toBeTruthy();
  });

  it('should have add to cart button', () => {
    fixture.detectChanges();

    const addBtn = fixture.nativeElement.querySelector('.add-btn');
    expect(addBtn).toBeTruthy();
    expect(addBtn.textContent).toContain('Add to Cart');
  });

  it('should display description heading', () => {
    fixture.detectChanges();

    const descHeading = fixture.nativeElement.querySelector('.product-description h3');
    expect(descHeading.textContent).toBe('Description');
  });

  it('should accept product input', () => {
    expect(component.product).toBe(mockProduct);
    expect(component.product.name).toBe('Test Product');
  });
});
