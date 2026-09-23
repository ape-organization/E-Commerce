import {
  CommonModule
} from '@angular/common';

import {
  Component,
  OnInit,
  DestroyRef,
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
  Router,
  RouterModule
} from '@angular/router';

import {
  TranslatePipe
} from '@ngx-translate/core';

import {
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
  catchError,
  of
} from 'rxjs';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  CartItem,
  CartService
} from '../../services/cart.service';

import {
  Product
} from '../../models/product.model';

import {
  environment
} from '../../../environments/environment';

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

import {
  OtpVerificationComponent
} from '../shared/otp-verification.component/otp-verification.component';


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
    TranslatePipe
  ],

  templateUrl: './checkout.html',

  styleUrls: ['./checkout.scss']
})
export class CheckoutComponent implements OnInit {

  // =========================================================
  // SERVICES
  // =========================================================

  private readonly fb =
    inject(FormBuilder);

  private readonly cartService =
    inject(CartService);

  private readonly clientService =
    inject(ClientService);

  private readonly dialog =
    inject(MatDialog);

  private readonly router =
    inject(Router);

  private readonly languageService =
    inject(LanguageService);

  private readonly destroyRef =
    inject(DestroyRef);


  // =========================================================
  // GOVERNORATES
  // =========================================================

  readonly governorates =
    EGYPT_GOVERNORATES;


  // =========================================================
  // LANGUAGE
  // =========================================================

  get isArabic(): boolean {

    return this.languageService.currentLanguage() === 'ar';

  }


  getGovernorateName(
    governorate: Governorate
  ): string {

    return this.isArabic
      ? governorate.nameAr
      : governorate.nameEn;

  }


  // =========================================================
  // SIGNALS
  // =========================================================

  readonly isSubmitting =
    signal(false);

  readonly isSearchingClient =
    signal(false);

  readonly clientFound =
    signal(false);

readonly cartLoading$ =
  this.cartService.cartLoading$;

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
          Validators.pattern(/^01[0-9]{9}$/)
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

    this.subscribeToCart();

    this.setupPhoneLookup();

  }


  // =========================================================
  // CART SUBSCRIPTION
  // =========================================================

  private subscribeToCart(): void {

    this.cartService.cartItems$
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(items => {

        /*
         * Always create a new array reference.
         *
         * This prevents UI problems when the cart service
         * internally changes the array.
         */
        this.cartItems = [...items];

      });

  }


  // =========================================================
  // TOTAL ITEMS
  // =========================================================

  get totalItems(): number {

    return this.cartItems.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
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
      .pipe(

        debounceTime(350),

        distinctUntilChanged(),

        filter(phone => {

          const normalized =
            this.normalizePhone(phone);

          return normalized.length === 11;

        }),

        switchMap(phone => {

          const normalized =
            this.normalizePhone(phone);

          this.isSearchingClient.set(true);

          this.clientFound.set(false);

          return this.clientService
            .getByPhone(normalized)
            .pipe(

              catchError(() => {

                return of(null);

              })

            );

        }),

        takeUntilDestroyed(this.destroyRef)

      )
      .subscribe(client => {

        this.isSearchingClient.set(false);


        /*
         * Check that the phone value has not changed while
         * the request was running.
         *
         * switchMap already protects us from most stale
         * responses, but this gives us another safe guard.
         */
        const currentPhone =
          this.normalizePhone(
            phoneControl.value
          );


        if (currentPhone.length !== 11) {

          this.clientFound.set(false);

          return;

        }


        // =====================================================
        // CLIENT NOT FOUND
        // =====================================================

        if (!client) {

          this.clientFound.set(false);

          return;

        }


        // =====================================================
        // CLIENT FOUND
        // =====================================================

        this.clientFound.set(true);


        this.checkoutForm.patchValue(
          {
            fullName:
              client.name ?? '',

            email:
              client.email ?? '',

            address:
              client.address ?? '',

            governorate:
              this.getArabicGovernorateName(
                client.governorate
              )

          },
          {
            emitEvent: false
          }
        );

      });


    /*
     * If the user deletes the phone or enters an invalid
     * phone, immediately remove the searching state.
     */
    phoneControl.valueChanges
      .pipe(
        filter(phone =>
          this.normalizePhone(phone).length < 11
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {

        this.isSearchingClient.set(false);

        this.clientFound.set(false);

      });

  }


  // =========================================================
  // NORMALIZE PHONE
  // =========================================================

  private normalizePhone(
    phone: string | null | undefined
  ): string {

    return (phone ?? '')
      .replace(/\D/g, '')
      .trim();

  }


  // =========================================================
  // NORMALIZE GOVERNORATE
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

          item.nameEn
            .trim()
            .toLowerCase() ===
            normalized.toLowerCase()
      );


    return governorate?.nameAr ?? '';

  }


  // =========================================================
  // GOVERNORATE
  // =========================================================

  selectGovernorate(
    governorate: Governorate
  ): void {

    this.checkoutForm.patchValue({

      governorate:
        governorate.nameAr

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

    return item.product.nameEn ?? '';

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


    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {

      return 0;

    }


    if (
      !Number.isFinite(discount) ||
      discount <= 0
    ) {

      return this.roundPrice(
        price
      );

    }


    const safeDiscount =
      Math.min(
        Math.max(discount, 0),
        100
      );


    const finalPrice =
      price *
      (1 - safeDiscount / 100);


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

    const quantity =
      Number(item.quantity ?? 0);

    const price =
      this.getFinalPrice(
        item.product
      );


    return this.roundPrice(
      price * quantity
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


    const baseUrl =
      environment.imageApiBaseUrl
        .replace(/\/+$/, '');


    const path =
      imageUrl.startsWith('/')
        ? imageUrl
        : `/${imageUrl}`;


    return `${baseUrl}${path}`;

  }


  // =========================================================
  // IMAGE ERROR
  // =========================================================

  onImageError(
    event: Event
  ): void {

    const image =
      event.target as HTMLImageElement;


    if (
      image.src.includes(
        'product-placeholder.png'
      )
    ) {

      return;

    }


    image.src =
      'assets/images/product-placeholder.png';

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

    /*
     * Prevent double clicks and accidental multiple
     * submissions.
     */
    if (this.isSubmitting()) {

      return;

    }


    // =======================================================
    // EMPTY CART
    // =======================================================

    if (this.cartItems.length === 0) {

      this.showError(
        'CHECKOUT.EMPTY_CART'
      );

      return;

    }


    // =======================================================
    // VALIDATE FORM
    // =======================================================

    if (this.checkoutForm.invalid) {

      this.checkoutForm.markAllAsTouched();

      return;

    }


    // =======================================================
    // FORM VALUES
    // =======================================================

    const form =
      this.checkoutForm.getRawValue();


    const phone =
      this.normalizePhone(
        form.phone
      );


    // =======================================================
    // PHONE SAFETY
    // =======================================================

    if (!/^01[0-9]{9}$/.test(phone)) {

      this.checkoutForm.controls.phone.markAsTouched();

      return;

    }


    // =======================================================
    // ORDER ITEMS
    // =======================================================

    const items =
      this.cartService.getOrderItems();


    if (!items.length) {

      this.showError(
        'CHECKOUT.EMPTY_CART'
      );

      return;

    }


    // =======================================================
    // ORDER REQUEST
    // =======================================================

    const orderRequest = {

      client: {

        name:
          form.fullName.trim(),

        phoneNumber:
          phone,

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


    // =======================================================
    // START SUBMISSION
    // =======================================================

    this.isSubmitting.set(true);


    // =======================================================
    // OTP
    // =======================================================

    this.dialog
      .open(
        OtpVerificationComponent,
        {
          width: '420px',
          maxWidth: 'calc(100vw - 24px)',
          disableClose: true,

          data: {

            order:
              orderRequest,

            phoneNumber:
              phone

          }

        }
      )
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({

        next: (result: any) => {

          /*
           * The OTP component is responsible for the
           * verification/order flow.
           *
           * If it closes without success, allow the
           * user to try again.
           */
          if (!result) {

            this.isSubmitting.set(false);

            return;

          }


          /*
           * If the OTP component returned successfully,
           * keep the submission locked while it finishes
           * navigation/order processing.
           *
           * If your OTP component closes with success after
           * completing the order, it will navigate away.
           */
          this.isSubmitting.set(false);

        },

        error: () => {

          this.isSubmitting.set(false);

          this.showError(
            'CHECKOUT.ORDER_FAILED'
          );

        }

      });

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
        maxWidth: 'calc(100vw - 24px)',

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