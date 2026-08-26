import {
  CommonModule
} from '@angular/common';

import {
  Component,
  inject,
  OnInit,
  signal
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Router
} from '@angular/router';

import {
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
  catchError,
  of
} from 'rxjs';

import {
  ClientService
} from '../../services/client.service';

import {
  OrderService
} from '../../services/order.service';

import {
  CartService,
  CartItem
} from '../../services/cart.service';

import {
  environment
} from '../../../environments/environment';


@Component({
  selector: 'app-checkout',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule
  ],

  templateUrl: './checkout.html',

  styleUrl: './checkout.scss',
})
export class Checkout
  implements OnInit {


  // ==========================================================
  // SERVICES
  // ==========================================================

  private readonly fb =
    inject(FormBuilder);

  private readonly router =
    inject(Router);

  private readonly clientService =
    inject(ClientService);

  private readonly orderService =
    inject(OrderService);

  private readonly cartService =
    inject(CartService);


  // ==========================================================
  // STATE
  // ==========================================================

  readonly isSubmitting =
    signal(false);

  readonly isSearchingClient =
    signal(false);

  readonly clientFound =
    signal(false);


  // ==========================================================
  // CART
  // ==========================================================

  cartItems: CartItem[] = [];


  // ==========================================================
  // DELIVERY
  // ==========================================================

  readonly deliveryFee =
    signal(50);


  // ==========================================================
  // IMAGE API
  // ==========================================================

  api =
    environment.imageApiBaseUrl;


  // ==========================================================
  // FORM
  // ==========================================================

  readonly checkoutForm =
    this.fb.nonNullable.group({

      fullName: [

        '',

        [
          Validators.required,
          Validators.minLength(3)
        ]

      ],

      phone: [

        '',

        [
          Validators.required,

          Validators.pattern(
            /^01[0125][0-9]{8}$/
          )
        ]

      ],

      email: [

        '',

        [
          Validators.email
        ]

      ],

      city: [
        ''
      ],

      address: [

        '',

        [
          Validators.required,
          Validators.minLength(5)
        ]

      ],

      apartment: [
        ''
      ],

      notes: [
        ''
      ]

    });


  // ==========================================================
  // INITIALIZE
  // ==========================================================

  ngOnInit(): void {

    this.loadCart();

    this.watchPhoneNumber();

  }


  // ==========================================================
  // LOAD CART
  // ==========================================================

  private loadCart(): void {

    this.cartService
      .cartItems$
      .subscribe(items => {

        this.cartItems =
          items;

      });

  }


  // ==========================================================
  // DISCOUNTED PRICE
  // ==========================================================

  getDiscountedPrice(
    item: CartItem
  ): number {

    return this.cartService
      .getFinalPrice(
        item.product
      );

  }


  // ==========================================================
  // ORIGINAL PRICE
  // ==========================================================

  getOriginalPrice(
    item: CartItem
  ): number {

    return Number(
      item.product.price ?? 0
    );

  }


  // ==========================================================
  // ITEM DISCOUNT
  // ==========================================================

  getItemDiscount(
    item: CartItem
  ): number {

    return Number(
      item.product.discountPercentage ?? 0
    );

  }


  // ==========================================================
  // ITEM SUBTOTAL
  // ==========================================================

  getItemSubtotal(
    item: CartItem
  ): number {

    return this.getDiscountedPrice(item) *
      item.quantity;

  }


  // ==========================================================
  // SEARCH CLIENT BY PHONE
  // ==========================================================

  private watchPhoneNumber(): void {

    this.checkoutForm
      .controls
      .phone
      .valueChanges

      .pipe(

        debounceTime(400),

        distinctUntilChanged(),

        filter(phone =>
          phone.length === 11
        ),

        switchMap(phone => {

          this.isSearchingClient.set(
            true
          );

          return this.clientService
            .getByPhone(phone)

            .pipe(

              catchError(() => {

                this.clientFound.set(
                  false
                );

                return of(null);

              })

            );

        })

      )

      .subscribe(client => {

        this.isSearchingClient.set(
          false
        );


        if (!client) {

          this.clientFound.set(
            false
          );

          return;

        }


        this.clientFound.set(
          true
        );


        this.checkoutForm.patchValue({

          fullName:
            client.name,

          email:
            client.email ?? '',

          address:
            client.address ?? ''

        });

      });

  }


  // ==========================================================
  // SUBTOTAL
  // ==========================================================

  get subtotal(): number {

    return this.cartItems.reduce(
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
  // TOTAL
  // ==========================================================

  get total(): number {

    return this.subtotal +
      this.deliveryFee();

  }


  // ==========================================================
  // TOTAL ITEMS
  // ==========================================================

  get totalItems(): number {

    return this.cartItems.reduce(
      (
        total,
        item
      ) => {

        return total +
          item.quantity;

      },
      0
    );

  }


  // ==========================================================
  // TOTAL SAVINGS
  // ==========================================================

  get totalSavings(): number {

    return this.cartItems.reduce(
      (
        total,
        item
      ) => {

        const original =
          this.getOriginalPrice(
            item
          );

        const discounted =
          this.getDiscountedPrice(
            item
          );


        return total +
          (
            (
              original -
              discounted
            ) *
            item.quantity
          );

      },
      0
    );

  }


  // ==========================================================
  // VALIDATION
  // ==========================================================

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


  // ==========================================================
  // PLACE ORDER
  // ==========================================================

  placeOrder(): void {

    // --------------------------------------------------------
    // FORM VALIDATION
    // --------------------------------------------------------

    if (
      this.checkoutForm.invalid
    ) {

      this.checkoutForm.markAllAsTouched();

      return;

    }


    // --------------------------------------------------------
    // PREVENT DOUBLE SUBMIT
    // --------------------------------------------------------

    if (
      this.isSubmitting()
    ) {

      return;

    }


    // --------------------------------------------------------
    // CART VALIDATION
    // --------------------------------------------------------

    if (
      this.cartItems.length === 0
    ) {

      alert(
        'Your cart is empty.'
      );

      this.router.navigate([
        '/cart'
      ]);

      return;

    }


    // --------------------------------------------------------
    // GET ORDER ITEMS
    // --------------------------------------------------------
    //
    // IMPORTANT:
    //
    // We get IDs directly from CartService.
    //
    // We DO NOT read localStorage here.
    //
    // --------------------------------------------------------

    const items =
      this.cartService.getOrderItems();


    if (
      items.length === 0
    ) {

      alert(
        'Your cart contains no valid products.'
      );

      this.router.navigate([
        '/cart'
      ]);

      return;

    }


    // --------------------------------------------------------
    // START SUBMIT
    // --------------------------------------------------------

    this.isSubmitting.set(
      true
    );


    const form =
      this.checkoutForm.getRawValue();


    const fullAddress =
      this.buildFullAddress(
        form.city,
        form.address,
        form.apartment
      );


    // ========================================================
    // EXACT CreateOrderDto STRUCTURE
    // ========================================================

    const request = {

      client: {

        name:
          form.fullName,

        phoneNumber:
          form.phone,

        address:
          fullAddress,

        email:
          form.email || null

      },

      items:

        items

    };


    // --------------------------------------------------------
    // DEBUG
    // --------------------------------------------------------

    console.log(
      'Create order request:',
      request
    );


    // --------------------------------------------------------
    // SEND TO API
    // --------------------------------------------------------

    this.orderService
      .createOrder(request)

      .subscribe({

        next: response => {

          console.log(
            'Order created:',
            response
          );


          // --------------------------------------------------
          // ORDER SUCCESS
          // --------------------------------------------------

          this.cartService
            .clearCart();


          this.isSubmitting.set(
            false
          );


          this.router.navigate([
            '/order-success'
          ]);

        },


        error: error => {

          console.error(
            'Failed to create order:',
            error
          );


          this.isSubmitting.set(
            false
          );


          alert(

            error?.error?.message ??

            'Failed to place order. Please try again.'

          );

        }

      });

  }


  // ==========================================================
  // BUILD ADDRESS
  // ==========================================================

  private buildFullAddress(
    city: string,
    address: string,
    apartment: string
  ): string {

    let result =
      `${city}, ${address}`;


    if (
      apartment.trim()
    ) {

      result +=
        `, ${apartment}`;

    }


    return result;

  }


  // ==========================================================
  // BACK TO CART
  // ==========================================================

  goBackToCart(): void {

    this.router.navigate([
      '/cart'
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

}