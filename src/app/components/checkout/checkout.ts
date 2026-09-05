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


import { environment } from '../../../environments/environment';
import { TranslatePipe } from '@ngx-translate/core';
import { ClientService } from '../../services/client.service';
import { NotifyMessage } from '../shared/notify-message/notify-message';


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
          Validators.pattern(/^[0-9+\-\s()]{7,20}$/)
        ]
      ],

      email: [
        '',
        [
          Validators.email
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

    return this.roundPrice(this.subtotal);
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

        this.searchClient(normalizedPhone);

      });
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

          if (!client) {

            this.clientFound.set(false);

            /**
             * Clear previous customer's
             * information when this is
             * a new phone number.
             */
            this.checkoutForm.patchValue(
              {
                fullName: '',
                email: '',
                address: ''
              },
              {
                emitEvent: false
              }
            );

            return;
          }

          this.clientFound.set(true);

          this.checkoutForm.patchValue(
            {
              fullName: client.name ?? '',
              email: client.email ?? '',
              address: client.address ?? ''
            },
            {
              emitEvent: false
            }
          );

        },

        error: error => {

          console.error(
            'Client lookup error:',
            error
          );

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

    const product = item.product;

    /**
     * If your Product model has both
     * nameEn and nameAr, this keeps the
     * existing English behavior.
     *
     * If you already have a language service
     * controlling the name, you can replace
     * this later.
     */
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
      Number(product.discountPercentage ?? 0);

    if (discount <= 0) {

      return this.roundPrice(price);
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

    return this.getItemSubtotal(item);
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

    if (this.cartItems.length === 0) {

      this.showError(
        'CHECKOUT.EMPTY_CART'
      );

      return;
    }

    if (this.checkoutForm.invalid) {

      this.checkoutForm.markAllAsTouched();

      return;
    }

    const form =
      this.checkoutForm.getRawValue();


    /**
     * IMPORTANT:
     *
     * We intentionally DO NOT send
     * price or discount from Angular.
     *
     * Backend calculates the real
     * price from the database.
     */
    const items =
      this.cartService.getOrderItems();


    if (items.length === 0) {

      this.showError(
        'CHECKOUT.EMPTY_CART'
      );

      return;
    }


    const request = {

      client: {

        name:
          form.fullName.trim(),

        phoneNumber:
          form.phone.trim(),

        address:
          form.address.trim(),

        email:
          form.email.trim()
            ? form.email.trim()
            : null

      },

      items

    };


    this.isSubmitting.set(true);


    this.orderService
      .createOrder(request)
      .subscribe({

        next: () => {

          this.isSubmitting.set(false);

          this.handleSuccessfulOrder();

        },

        error: error => {

          console.error(
            'Create order error:',
            error
          );

          this.isSubmitting.set(false);

          const message =
            error?.error?.message ??
            'CHECKOUT.ORDER_FAILED';

          this.showError(message);

        }

      });
  }


  // =========================================================
  // SUCCESS
  // =========================================================

  private handleSuccessfulOrder(): void {

    /**
     * Clear the cart exactly once.
     */
    this.cartService.clearCart();


    const dialogRef =
      this.dialog.open(
        NotifyMessage,
        {
          width: '400px',

          disableClose: true,

          data: {

            title:
              'ORDER.SUCCESS',

            message:
              'ORDER.SUCCESSORDER'

          }
        }
      );


    dialogRef
      .afterClosed()
      .subscribe(() => {

        this.router.navigate([
          '/products'
        ]);

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