import { Component, Inject } from '@angular/core';
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
    MatDialogModule,
    MatButtonModule,
    FormsModule,
    MaterialModule
  ],

  templateUrl: './product-modal.component.html',

  styleUrl: './product-modal.component.css'
})
export class ProductModalComponent {

  // =====================================================
  // QUANTITY
  // =====================================================

  quantity: number = 0;


  // =====================================================
  // API
  // =====================================================

  api = environment.imageApiBaseUrl;


  constructor(
    public dialogRef: MatDialogRef<ProductModalComponent>,

    @Inject(MAT_DIALOG_DATA)
    public product: any,

    private cartService: CartService
  ) {console.log(product)}


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


  // =====================================================
  // OUT OF STOCK
  // =====================================================

  get isOutOfStock(): boolean {

    return this.product.isInStock;

  }


  // =====================================================
  // CAN ADD TO CART
  // =====================================================

  get canAddToCart(): boolean {

    return (
      this.product.isInStock
    );

  }


  // =====================================================
  // DISCOUNT
  // =====================================================

  get hasDiscount(): boolean {

    return !!(
      this.product?.discountPercentage &&
      this.product.discountPercentage > 0
    );

  }


  // =====================================================
  // OLD PRICE
  // =====================================================

  get oldPrice(): number {

    return Number(
      this.product?.price || 0
    );

  }


  // =====================================================
  // NEW PRICE
  // =====================================================

  get newPrice(): number {

    if (!this.hasDiscount) {

      return this.oldPrice;

    }

    const discount =
      Number(this.product.discountPercentage);

    return this.oldPrice -
      (this.oldPrice * discount / 100);

  }


  // =====================================================
  // QUANTITY VALIDATION
  // =====================================================

  validateQuantity(): void {

    const value = Number(this.quantity);


    // Invalid value

    if (!Number.isFinite(value)) {

      this.quantity = 0;

      return;

    }


    // Quantity below zero

    if (value < 0) {

      this.quantity = 0;

      return;

    }


    // Remove decimal values

    this.quantity = Math.floor(value);


    // Don't allow quantity greater than stock

    if (this.quantity > this.stock) {

      this.quantity = this.stock;

    }

  }


  // =====================================================
  // ADD TO CART
  // =====================================================

  addToCart(): void {



  // ========================================================
  // OUT OF STOCK
  // ========================================================

  if (!this.product.isInStock) {

    return;

  }


  // ========================================================
  // QUANTITY
  // ========================================================

  const quantity =
    this.quantity || 0;


  if (quantity <= 0) {

    return;

  }


  // ========================================================
  // ADD TO CART
  // ========================================================

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

}