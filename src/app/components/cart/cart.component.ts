import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';

import {
  CartService,
  CartItem
} from '../../services/cart.service';

import {
  ConfirmDialogComponent
} from '../confirm-dialog/confirm-dialog.component';

import { Router } from '@angular/router';

import { Product } from '../../models/product.model';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-cart',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule
  ],

  templateUrl: './cart.component.html',

  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {

  cartItems: CartItem[] = [];

  cartTotal: number = 0;

  private readonly router = inject(Router);


  constructor(
    private cartService: CartService,

    private dialog: MatDialog,

    private cdr: ChangeDetectorRef
  ) {}


  ngOnInit(): void {

    this.cartService.cartItems$
      .subscribe(items => {

        this.cartItems = items;

        this.calculateCartTotal();

      });

  }


  // =====================================================
  // ORIGINAL PRICE
  // =====================================================

  getOldPrice(product: Product): number {

    return Number(product.price || 0);

  }


  // =====================================================
  // DISCOUNT PERCENTAGE
  // =====================================================

  getDiscountPercentage(product: Product): number {

    return Number(
      product.discountPercentage || 0
    );

  }


  // =====================================================
  // NEW / FINAL PRICE
  //
  // price = OLD PRICE
  // discountPercentage = DISCOUNT
  // =====================================================

  getNewPrice(product: Product): number {

    const oldPrice =
      Number(product.price || 0);

    const discount =
      Number(product.discountPercentage || 0);


    if (discount <= 0) {

      return oldPrice;

    }


    return oldPrice -
      (
        oldPrice *
        discount /
        100
      );

  }


  // =====================================================
  // ITEM SUBTOTAL
  // =====================================================

  getItemSubtotal(item: CartItem): number {

    const product =
      item.product as Product;


    const newPrice =
      this.getNewPrice(product);


    return newPrice *
      Number(item.quantity || 0);

  }


  // =====================================================
  // CART TOTAL
  // =====================================================

  calculateCartTotal(): void {

    this.cartTotal =
      this.cartItems.reduce(
        (total, item) => {

          return total +
            this.getItemSubtotal(item);

        },
        0
      );

  }


  // =====================================================
  // BRAND
  // =====================================================

  getBrandName(product: Product): string {

    return (
      product.brand?.name ||
      product.brandName ||
      'BEAUTY'
    );

  }


  // =====================================================
  // CATEGORY
  // =====================================================

  getCategoryName(product: Product): string {

    return (
      product.subCategories?.[0]?.categoryName ||
      'BEAUTY'
    );

  }


  // =====================================================
  // SUBCATEGORY
  // =====================================================

  getSubCategoryName(product: Product): string {

    return (
      product.subCategories?.[0]?.name ||
      'Collection'
    );

  }


  // =====================================================
  // REMOVE
  // =====================================================

  removeFromCart(productId: number): void {

    this.cartService.removeFromCart(productId);

  }


  // =====================================================
  // BACK
  // =====================================================

  back(): void {

    this.router.navigate([
      '/products'
    ]);

  }


  // =====================================================
  // UPDATE QUANTITY
  // =====================================================

  updateQuantity(
    productId: number,
    quantity: number
  ): void {

    if (quantity <= 0) {

      return;

    }


    this.cartService.updateQuantity(
      productId,
      quantity
    );


    this.calculateCartTotal();

  }


  // =====================================================
  // CLEAR CART
  // =====================================================

  clearCart(): void {

    const dialogRef =
      this.dialog.open(
        ConfirmDialogComponent,
        {
          width: '400px',

          data: {
            title: 'Clear Cart',

            message:
              'Are you sure you want to clear the cart?'
          }
        }
      );


    dialogRef
      .afterClosed()
      .subscribe(result => {

        if (result) {

          this.cartService.clearCart();

          this.cartTotal = 0;

          this.cdr.detectChanges();

        }

      });

  }


  // =====================================================
  // CHECKOUT
  // =====================================================

  goToCheckout(): void {

    this.router.navigate([
      '/checkout'
    ]);

  }
 // ========================================================
  // IMAGE URL
  // ========================================================
api=environment.imageApiBaseUrl
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
// CART TOTAL
// =====================================================

getCartTotal(): number {

  return this.cartItems.reduce(
    (total, item) => {

      const product = item.product as Product;

      const oldPrice = Number(product.price || 0);

      const discount = Number(
        product.discountPercentage || 0
      );

      const finalPrice =
        discount > 0
          ? oldPrice - (oldPrice * discount / 100)
          : oldPrice;
      return total + (finalPrice * Number(item.quantity || 0));

    },
    0
  );

}
}