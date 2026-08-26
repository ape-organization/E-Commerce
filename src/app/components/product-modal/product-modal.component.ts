import {
  Component,
  Inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';

import { CartService } from '../../services/cart.service';
import { MaterialModule } from '../../shared/AngularMaterial';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-modal',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MaterialModule
  ],

  templateUrl: './product-modal.component.html',
  styleUrl: './product-modal.component.css'
})
export class ProductModalComponent {

  // =====================================================
  // QUANTITY
  // =====================================================

  quantity = signal(0);

  // =====================================================
  // IMAGE API
  // =====================================================

  api = environment.imageApiBaseUrl;


  constructor(
    public dialogRef: MatDialogRef<ProductModalComponent>,

    @Inject(MAT_DIALOG_DATA)
    public product: any,

    private cartService: CartService
  ) {}


  // =====================================================
  // STOCK
  // =====================================================

  get stock(): number {

    return Number(
      this.product?.stock ??
      this.product?.quantity ??
      0
    );

  }


  get isOutOfStock(): boolean {

    return this.product?.isInStock !== true;

  }


  get canAddToCart(): boolean {

    return (
      this.product?.isInStock === true &&
      this.quantity() > 0
    );

  }


  // =====================================================
  // PRICE
  // =====================================================

  get hasDiscount(): boolean {

    return Number(
      this.product?.discountPercentage ?? 0
    ) > 0;

  }


  get oldPrice(): number {

    return Number(
      this.product?.price ?? 0
    );

  }


  get newPrice(): number {

    if (!this.hasDiscount) {
      return this.oldPrice;
    }

    const discount =
      Number(
        this.product?.discountPercentage ?? 0
      );

    return Math.max(
      0,
      this.oldPrice -
      (this.oldPrice * discount / 100)
    );

  }


  // =====================================================
  // QUANTITY
  // =====================================================

  setQuantity(value: number): void {

    let quantity = Number(value);

    if (!Number.isFinite(quantity)) {
      quantity = 0;
    }

    quantity = Math.floor(quantity);

    if (quantity < 0) {
      quantity = 0;
    }

    if (this.stock > 0 && quantity > this.stock) {
      quantity = this.stock;
    }

    this.quantity.set(quantity);

  }


  validateQuantity(): void {

    this.setQuantity(this.quantity());

  }


  // =====================================================
  // ADD TO CART
  // =====================================================

  addToCart(): void {

    if (!this.product?.isInStock) {
      return;
    }

    this.validateQuantity();

    const quantity = this.quantity();

    if (quantity <= 0) {
      return;
    }

    if (this.stock > 0 && quantity > this.stock) {
      return;
    }

    this.cartService.addToCart(
      this.product,
      quantity
    );

    this.dialogRef.close();

  }


  // =====================================================
  // CLOSE
  // =====================================================

  closeDialog(): void {

    this.dialogRef.close();

  }


  // =====================================================
  // IMAGE URL
  // =====================================================

  getImageUrl(
    imageUrl?: string | null
  ): string {

    if (!imageUrl) {

      return 'assets/images/product-placeholder.png';

    }

    if (
      imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://')
    ) {

      return imageUrl;

    }

    return `${this.api}${imageUrl}`;

  }


  // =====================================================
  // CATEGORY
  // =====================================================

  getCategoryName(): string {

    return (
      this.product?.subCategories?.[0]?.categoryName ||
      'Category'
    );

  }


  // =====================================================
  // BRAND
  // =====================================================

  getBrandName(): string {

    return (
      this.product?.brand?.name ||
      this.product?.brandName ||
      'BEAUTY BRAND'
    );

  }

}