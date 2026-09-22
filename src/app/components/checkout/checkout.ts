
import {
  CommonModule
} from '@angular/common';

import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  MatButtonModule
} from '@angular/material/button';

import {
  MatDialog,
  MatDialogModule
} from '@angular/material/dialog';

import {
  MatIconModule
} from '@angular/material/icon';

import {
  MatProgressSpinnerModule
} from '@angular/material/progress-spinner';

import {
  Router,
  RouterModule
} from '@angular/router';

import {
  CartItem,
  CartService
} from '../../services/cart.service';

import {
  Product
} from '../../models/product.model';

import {
  ProductService
} from '../../services/product.service';

import {
  OrderService
} from '../../services/order.service';

import {
  environment
} from '../../../environments/environment';

import {
  TranslatePipe
} from '@ngx-translate/core';

import {
  ClientService
} from '../../services/client.service';

import {
  NotifyMessage
} from '../shared/notify-message/notify-message';

import {
  EGYPT_GOVERNORATES,
  Governorate
} from '../../models/egypt-governorates';

import {
  LanguageService
} from '../../services/language.service';
import { OtpVerificationComponent } from '../shared/otp-verification.component/otp-verification.component';
import { OtpService } from '../../services/otp.service';


@Component({
  selector: 'app-checkout',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslatePipe
  ],

  templateUrl: './checkout.html',

  styleUrls: ['./checkout.scss']
})
export class CheckoutComponent implements OnInit {

  // =========================================================
  // GOVERNORATES
  // =========================================================

  readonly governorates =
    EGYPT_GOVERNORATES;
 private readonly OtpService =
    inject(OtpService);
  private readonly languageService =
    inject(LanguageService);

  get isArabic(): boolean {
    return this.languageService.currentLanguage() === 'ar';
  }

  /**
   * Display name according to the current language.
   *
   * IMPORTANT:
   * This is ONLY for displaying the governorate.
   *
   * The value stored in the form is ALWAYS nameAr.
   */
  getGovernorateName(
    governorate: Governorate
  ): string {

    return this.isArabic
      ? governorate.nameAr
      : governorate.nameEn;
  }

  /**
   * Select governorate.
   *
   * IMPORTANT:
   * We save the Arabic name in the form,
   * regardless of the current UI language.
   */
  selectGovernorate(
    governorate: Governorate
  ): void {

    this.checkoutForm.patchValue({
      governorate: governorate.nameAr
    });
  }


  // =========================================================
  // SERVICES
  // =========================================================

  private readonly fb =
    inject(FormBuilder);

  private readonly cartService =
    inject(CartService);

  private readonly clientService =
    inject(ClientService);

  private readonly orderService =
    inject(OrderService);

  private readonly dialog =
    inject(MatDialog);

  private readonly router =
    inject(Router);


  // =========================================================
  // SIGNALS
  // =========================================================

  readonly isSubmitting =
    signal(false);

  readonly isSearchingClient =
    signal(false);

  readonly clientFound =
    signal(false);


  // =========================================================
  // CART
  // =========================================================

  cartItems: CartItem[] = [];


  // =========================================================
  // FORM
  // =========================================================

  checkoutForm =
    this.fb.nonNullable.group({

      fullName: [
        '',
        [
          Validators.required,
          Validators.minLength(2)
        ]
      ],

      phone: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^[0-9+\-\s()]{7,20}$/
          )
        ]
      ],

      email: [
        '',
        [
          Validators.email
        ]
      ],

      governorate: [
        '',
        [
          Validators.required
        ]
      ],

      address: [
        '',
        [
          Validators.required,
          Validators.minLength(5)
        ]
      ]

    });


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    this.cartService.cartItems$
      .subscribe(items => {

        this.cartItems = items;

      });

    this.setupPhoneLookup();
  }


  // =========================================================
  // TOTAL ITEMS
  // =========================================================

  get totalItems(): number {

    return this.cartItems.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );
  }


  // =========================================================
  // SUBTOTAL
  // =========================================================

  get subtotal(): number {

    const total =
      this.cartItems.reduce(
        (sum, item) =>
          sum + this.getItemSubtotal(item),
        0
      );

    return this.roundPrice(total);
  }


  // =========================================================
  // TOTAL
  // =========================================================

  get total(): number {

    return this.roundPrice(
      this.subtotal
    );
  }


  // =========================================================
  // PHONE LOOKUP
  // =========================================================

  private setupPhoneLookup(): void {

    const phoneControl =
      this.checkoutForm.controls.phone;

    phoneControl.valueChanges
      .subscribe(phone => {

        const normalizedPhone =
          phone.trim();

        if (normalizedPhone.length < 7) {

          this.clientFound.set(false);

          return;
        }

        this.searchClient(
          normalizedPhone
        );

      });
  }


  // =========================================================
  // NORMALIZE GOVERNORATE
  //
  // The form must ALWAYS contain the Arabic
  // governorate name.
  //
  // This also handles old client records that
  // may contain the English governorate name.
  // =========================================================

  private getArabicGovernorateName(
    value: string | null | undefined
  ): string {

    if (!value?.trim()) {
      return '';
    }

    const normalized =
      value.trim();

    const governorate =
      this.governorates.find(
        item =>
          item.nameAr.trim() === normalized ||
          item.nameEn.trim().toLowerCase() ===
            normalized.toLowerCase()
      );

    return governorate?.nameAr ?? '';
  }


  // =========================================================
  // SEARCH CLIENT
  // =========================================================

  private searchClient(
    phone: string
  ): void {

    this.isSearchingClient.set(true);

    this.clientService
      .getByPhone(phone)
      .subscribe({

        next: client => {

          this.isSearchingClient.set(false);

          // ===============================================
          // CLIENT NOT FOUND
          // ===============================================

          if (!client) {

            this.clientFound.set(false);

            this.checkoutForm.patchValue(
              {
                fullName: '',
                email: '',
                address: '',
                governorate: ''
              },
              {
                emitEvent: false
              }
            );

            return;
          }


          // ===============================================
          // CLIENT FOUND
          // ===============================================

          this.clientFound.set(true);

          this.checkoutForm.patchValue(
            {
              fullName:
                client.name ?? '',

              email:
                client.email ?? '',

              address:
                client.address ?? '',

              /**
               * IMPORTANT:
               *
               * Regardless of whether the existing
               * client record contains Arabic or
               * English, convert it to Arabic before
               * putting it into the form.
               */
              governorate:
                this.getArabicGovernorateName(
                  client.governorate
                )
            },
            {
              emitEvent: false
            }
          );

        },

        error: error => {
 this.isSearchingClient.set(false);

          this.clientFound.set(false);

        }

      });
  }


  // =========================================================
  // BACK TO CART
  // =========================================================

  goBackToCart(): void {

    this.router.navigate([
      '/cart'
    ]);
  }


  // =========================================================
  // PRODUCT NAME
  // =========================================================

  getProductName(
    item: CartItem
  ): string {

    const product =
      item.product;

    return product.nameEn ?? '';
  }


  // =========================================================
  // DISCOUNTED PRICE
  // =========================================================

  getDiscountedPrice(
    item: CartItem
  ): number {

    return this.getFinalPrice(
      item.product
    );
  }


  // =========================================================
  // FINAL PRODUCT PRICE
  // =========================================================

  getFinalPrice(
    product: Product
  ): number {

    const price =
      Number(product.price ?? 0);

    const discount =
      Number(
        product.discountPercentage ?? 0
      );

    if (discount <= 0) {

      return this.roundPrice(
        price
      );
    }

    const finalPrice =
      price *
      (1 - discount / 100);

    return this.roundPrice(
      finalPrice
    );
  }


  // =========================================================
  // ITEM SUBTOTAL
  // =========================================================

  getItemSubtotal(
    item: CartItem
  ): number {

    const price =
      this.getFinalPrice(
        item.product
      );

    return this.roundPrice(
      price * item.quantity
    );
  }


  // =========================================================
  // ITEM TOTAL
  // =========================================================

  getItemTotal(
    item: CartItem
  ): number {

    return this.getItemSubtotal(
      item
    );
  }


  // =========================================================
  // IMAGE URL
  // =========================================================

  getImageUrl(
    imageUrl: string | null | undefined
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

    return `${environment.imageApiBaseUrl}${imageUrl}`;
  }


  // =========================================================
  // INCREASE
  // =========================================================

  increaseQuantity(
    productId: number
  ): void {

    this.cartService
      .increaseQuantity(productId);
  }


  // =========================================================
  // DECREASE
  // =========================================================

  decreaseQuantity(
    productId: number
  ): void {

    this.cartService
      .decreaseQuantity(productId);
  }


  // =========================================================
  // REMOVE
  // =========================================================

  removeItem(
    productId: number
  ): void {

    this.cartService
      .removeFromCart(productId);
  }


  // =========================================================
  // PLACE ORDER
  // =========================================================

  placeOrder(): void {

    if (this.isSubmitting()) {
      return;
    }


    // ===============================================
    // EMPTY CART
    // ===============================================

    if (this.cartItems.length === 0) {

      this.showError(
        'CHECKOUT.EMPTY_CART'
      );

      return;
    }


    // ===============================================
    // FORM VALIDATION
    // ===============================================

    if (this.checkoutForm.invalid) {

      this.checkoutForm.markAllAsTouched();

      return;
    }


    const form =
      this.checkoutForm.getRawValue();


    // ===============================================
    // ORDER ITEMS
    // ===============================================

    const items =
      this.cartService.getOrderItems();


    if (items.length === 0) {

      this.showError(
        'CHECKOUT.EMPTY_CART'
      );

      return;
    }
      const request = {
      phoneNumber: form.phone.trim()
    };
       const orderRequest = {

      client: {

        name:
          form.fullName.trim(),

        phoneNumber:
          form.phone.trim(),

        address:
          form.address.trim(),

        governorate:
          form.governorate.trim(),

        email:
          form.email.trim()
            ? form.email.trim()
            : null

      },

      items

    };



this.dialog.open(OtpVerificationComponent, {
  data: {
    order:orderRequest,
    phoneNumber: form.phone.trim()
  }
}).afterClosed().subscribe((res:any)=>{
  if(!res)
  {
    this.isSubmitting.set(false);

          const message ='CHECKOUT.ORDER_FAILED';

          this.showError(
            message
          );

  }
  return
})
           


    // ===============================================
    // REQUEST
    // ===============================================

  
  }


 


  // =========================================================
  // ERROR
  // =========================================================

  private showError(
    message: string
  ): void {

    this.dialog.open(
      NotifyMessage,
      {
        width: '400px',

        data: {

          title:
            'COMMON.ERROR',

          message

        }
      }
    );
  }


  // =========================================================
  // VALIDATION
  // =========================================================

  isInvalid(
    controlName: string
  ): boolean {

    const control =
      this.checkoutForm.get(
        controlName
      );

    return !!(
      control &&
      control.invalid &&
      (
        control.dirty ||
        control.touched
      )
    );
  }


  // =========================================================
  // ROUND PRICE
  // =========================================================

  private roundPrice(
    value: number
  ): number {

    return Math.round(
      (value + Number.EPSILON) * 100
    ) / 100;
  }

}
