import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';
import { ProductModalComponent } from '../product-modal/product-modal.component';
import { environment } from '../../../environments/environment';
import { MaterialModule } from '../../shared/AngularMaterial';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatDialogModule,
    MaterialModule
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  quantities: Record<number, number> = {};
  api = environment.imageApiBaseUrl;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        // Map into new array to trigger change detection
        this.products = products.map((p) => ({
          ...p,
          imageUrl: this.api + p.imageUrl,
        }));

        // Initialize quantities safely
        this.quantities = {};
        this.products.forEach((p) => (this.quantities[p.id] = 1));
        // Ensure UI updates immediately
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading products:', err),
    });
  }

  openProductDetails(product: Product): void {
    this.dialog.open(ProductModalComponent, {
      width: '800px',
      data: product,
      disableClose: false,
    });
  }

  addToCart(product: Product, event: Event): void {
    event.stopPropagation();
    const quantity = this.quantities[product.id] || 1;
    
    this.cartService.addToCart(product, quantity);
  }
}