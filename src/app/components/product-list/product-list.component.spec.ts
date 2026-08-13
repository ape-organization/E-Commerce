import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { ProductListComponent } from './product-list.component';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { ProductModalComponent } from '../product-modal/product-modal.component';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let mockProductService: jasmine.SpyObj<ProductService>;

  const mockProducts: Product[] = [
    { id: 1, name: 'Product 1', price: 19.99, image: 'image1.jpg', description: 'Test product 1' },
    { id: 2, name: 'Product 2', price: 29.99, image: 'image2.jpg', description: 'Test product 2' },
    { id: 3, name: 'Product 3', price: 39.99, image: 'image3.jpg', description: 'Test product 3' }
  ];

  beforeEach(async () => {
    mockProductService = jasmine.createSpyObj('ProductService', ['getProducts']);
    mockProductService.getProducts.and.returnValue(of(mockProducts));

    await TestBed.configureTestingModule({
      imports: [ProductListComponent, CommonModule, FormsModule, ProductModalComponent],
      providers: [
        { provide: ProductService, useValue: mockProductService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load products on init', () => {
    fixture.detectChanges();
    expect(mockProductService.getProducts).toHaveBeenCalled();
    expect(component.products.length).toBe(3);
    expect(component.products[0].name).toBe('Product 1');
  });

  it('should initialize quantities for each product', () => {
    fixture.detectChanges();
    expect(component.quantities[1]).toBe(1);
    expect(component.quantities[2]).toBe(1);
    expect(component.quantities[3]).toBe(1);
  });

  it('should open product details modal when clicking on a product card', () => {
    fixture.detectChanges();
    const product = mockProducts[0];
    
    component.openProductDetails(product);
    
    expect(component.selectedProduct).toBe(product);
  });

  it('should close modal when closeModal is called', () => {
    component.selectedProduct = mockProducts[0];
    
    component.closeModal();
    
    expect(component.selectedProduct).toBeNull();
  });

  it('should display all products in the grid', () => {
    fixture.detectChanges();
    
    const productCards = fixture.nativeElement.querySelectorAll('.product-card');
    expect(productCards.length).toBe(3);
  });

  it('should display loading state when no products are loaded', () => {
    component.products = [];
    fixture.detectChanges();
    
    const loadingSpinner = fixture.nativeElement.querySelector('.loading-spinner');
    expect(loadingSpinner).toBeTruthy();
    expect(loadingSpinner.textContent).toContain('Loading products');
  });

  it('should hide loading state when products are loaded', () => {
    fixture.detectChanges();
    
    const loadingSpinner = fixture.nativeElement.querySelector('.loading-spinner');
    expect(loadingSpinner).toBeFalsy();
  });

  it('should display product information correctly', () => {
    fixture.detectChanges();
    
    const productName = fixture.nativeElement.querySelector('.product-name');
    const productPrice = fixture.nativeElement.querySelector('.product-price');
    
    expect(productName.textContent).toContain('Product 1');
    expect(productPrice.textContent).toContain('19.99');
  });

  it('should allow changing product quantity', () => {
    fixture.detectChanges();
    
    component.quantities[1] = 5;
    fixture.detectChanges();
    
    expect(component.quantities[1]).toBe(5);
  });

  it('should display product images with correct src and alt', () => {
    fixture.detectChanges();
    
    const productImage = fixture.nativeElement.querySelector('.product-image img');
    expect(productImage.src).toContain('image1.jpg');
    expect(productImage.alt).toBe('Product 1');
  });

  it('should not open modal when quantity input is clicked', () => {
    fixture.detectChanges();
    const product = mockProducts[0];
    const quantityInput = fixture.nativeElement.querySelector('.quantity-input');
    
    component.selectedProduct = null;
    quantityInput.click();
    
    expect(component.selectedProduct).toBeNull();
  });
});
