import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  MatButtonModule
} from '@angular/material/button';

import {
  MatIconModule
} from '@angular/material/icon';

import {
  MatDialog
} from '@angular/material/dialog';

import {
  Subject,
  takeUntil
} from 'rxjs';

import {
  CartService,
  CartItem
} from '../../services/cart.service';

import {
  ConfirmDialogComponent
} from '../shared/confirm-dialog/confirm-dialog.component';

import {
  Router
} from '@angular/router';

import {
  Product
} from '../../models/product.model';

import {
  environment
} from '../../../environments/environment';

import {
  TranslatePipe
} from '@ngx-translate/core';

import {
  LanguageService
} from '../../services/language.service';


@Component({
  selector: 'app-cart',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    TranslatePipe
  ],

  templateUrl: './cart.component.html',

  styleUrl: './cart.component.css'
})
export class CartComponent
  implements OnInit, OnDestroy {


  // ==========================================================
  // CART
  // ==========================================================

  cartItems: CartItem[] = [];

  cartTotal = 0;


  // ==========================================================
  // API
  // ==========================================================

  api =
    environment.imageApiBaseUrl;


  // ==========================================================
  // DESTROY
  // ==========================================================

  private readonly destroy$ =
    new Subject<void>();


  // ==========================================================
  // CONSTRUCTOR
  // ==========================================================

  constructor(

    private cartService: CartService,

    private dialog: MatDialog,

    private cdr: ChangeDetectorRef,

    private router: Router,

    public languageService: LanguageService

  ) {}


  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {

    this.cartService
      .cartItems$

      .pipe(
        takeUntil(
          this.destroy$
        )
      )

      .subscribe(items => {

        this.cartItems =
          items;

        this.calculateCartTotal();

        this.cdr.detectChanges();

      });

  }


  // ==========================================================
  // DESTROY
  // ==========================================================

  ngOnDestroy(): void {

    this.destroy$.next();

    this.destroy$.complete();

  }


  // ==========================================================
  // PRODUCT NAME
  // ==========================================================

  getProductName(
    product: Product
  ): string {

    if (
      this.languageService.isArabic()
    ) {

      return (
        product?.nameAr?.trim() ||
        product?.nameEn ||
        'Product'
      );

    }

    return (
      product?.nameEn?.trim() ||
      product?.nameAr ||
      'Product'
    );

  }


  // ==========================================================
  // ORIGINAL PRICE
  // ==========================================================

  getOldPrice(
    product: Product
  ): number {

    return Number(
      product.price ?? 0
    );

  }


  // ==========================================================
  // DISCOUNT
  // ==========================================================

  getDiscountPercentage(
    product: Product
  ): number {

    return Number(
      product.discountPercentage ?? 0
    );

  }


  // ==========================================================
  // NEW PRICE
  // ==========================================================

  getNewPrice(
    product: Product
  ): number {

    return this.cartService
      .getFinalPrice(product);

  }


  // ==========================================================
  // ITEM SUBTOTAL
  // ==========================================================

  getItemSubtotal(
    item: CartItem
  ): number {

    return this.getNewPrice(
      item.product
    ) * Number(
      item.quantity ?? 0
    );

  }


  // ==========================================================
  // CALCULATE TOTAL
  // ==========================================================

  calculateCartTotal(): void {

    this.cartTotal =
      this.cartItems.reduce(
        (
          total,
          item
        ) => {

          return total +
            this.getItemSubtotal(
              item
            );

        },
        0
      );

  }


  // ==========================================================
  // BRAND
  // ==========================================================

  getBrandName(
    product: Product
  ): string {

    const brand =
      product?.brand;

    if (brand) {

      if (
        this.languageService.isArabic()
      ) {

        return (
          brand.nameAr?.trim() ||
          brand.nameEn ||
          'BEAUTY'
        );

      }

      return (
        brand.nameEn?.trim() ||
        brand.nameAr ||
        'BEAUTY'
      );

    }


    if (
      this.languageService.isArabic()
    ) {

      return (
        product?.brand?.nameAr?.trim() ||
        product?.brand?.nameEn ||
        'BEAUTY'
      );

    }

    return (
      product?.brand?.nameAr.trim() ||
      product?.brand?.nameEn ||
      'BEAUTY'
    );

  }


  // ==========================================================
  // CATEGORY
  // ==========================================================

  getCategoryName(
    product: Product
  ): string {

    const subCategory =
      product?.subCategories?.[0];

    if (!subCategory) {

      return 'BEAUTY';

    }


    if (
      this.languageService.isArabic()
    ) {

      return (
        subCategory.categoryNameAr?.trim() ||
        subCategory.categoryNameEn ||
        'BEAUTY'
      );

    }

    return (
      subCategory.categoryNameEn?.trim() ||
      subCategory.categoryNameAr ||
      'BEAUTY'
    );

  }


  // ==========================================================
  // SUBCATEGORY
  // ==========================================================

  getSubCategoryName(
    product: Product
  ): string {

    const subCategory =
      product?.subCategories?.[0];

    if (!subCategory) {

      return 'Collection';

    }


    if (
      this.languageService.isArabic()
    ) {

      return (
        subCategory.nameAr?.trim() ||
        subCategory.nameEn ||
        'Collection'
      );

    }

    return (
      subCategory.nameEn?.trim() ||
      subCategory.nameAr ||
      'Collection'
    );

  }


  // ==========================================================
  // REMOVE
  // ==========================================================

  removeFromCart(
    productId: number
  ): void {

    this.cartService
      .removeFromCart(
        productId
      );

  }


  // ==========================================================
  // UPDATE QUANTITY
  // ==========================================================

  updateQuantity(
    productId: number,
    quantity: number
  ): void {

    quantity =
      Number(quantity);


    if (
      !Number.isFinite(quantity)
    ) {

      return;

    }


    quantity =
      Math.floor(quantity);


    if (
      quantity <= 0
    ) {

      this.cartService
        .removeFromCart(
          productId
        );

      return;

    }


    this.cartService
      .updateQuantity(
        productId,
        quantity
      );

  }


  // ==========================================================
  // CLEAR CART
  // ==========================================================

  clearCart(): void {

    const dialogRef =
      this.dialog.open(
        ConfirmDialogComponent,
        {

          width: '400px',

          data: {

            title:
              'CART.CLEAR_CART',

            message:
              'CART.CLEAR_CART_CONFIRM'

          }

        }
      );


    dialogRef
      .afterClosed()

      .subscribe(result => {

        if (!result) {

          return;

        }


        this.cartService
          .clearCart();


        this.cartTotal =
          0;


        this.cdr.detectChanges();

      });

  }


  // ==========================================================
  // CHECKOUT
  // ==========================================================

  goToCheckout(): void {

    if (
      this.cartItems.length === 0
    ) {

      return;

    }


    this.router.navigate([
      '/checkout'
    ]);

  }


  // ==========================================================
  // BACK
  // ==========================================================

  back(): void {

    this.router.navigate([
      '/products'
    ]);

  }


  // ==========================================================
  // IMAGE URL
  // ==========================================================

  getImageUrl(
    imageUrl?: string | null
  ): string {

    if (!imageUrl) {

      return 'assets/images/product-placeholder.png';

    }


    if (

      imageUrl.startsWith(
        'http://'
      ) ||

      imageUrl.startsWith(
        'https://'
      )

    ) {

      return imageUrl;

    }


    return `${this.api}${imageUrl}`;

  }


  // ==========================================================
  // CART TOTAL
  // ==========================================================

  getCartTotal(): number {

    return this.cartService
      .getCartTotal();

  }

}