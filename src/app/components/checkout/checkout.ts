import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';

import {
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
  catchError,
  of
} from 'rxjs';

import { ClientService } from '../../services/client.service';
import { OrderService } from '../../services/order.service';
import { CartService, CartItem } from '../../services/cart.service';

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
export class Checkout implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  private readonly clientService = inject(ClientService);
  private readonly orderService = inject(OrderService);
  private readonly cartService = inject(CartService);


  // ==========================================
  // STATE
  // ==========================================

  readonly isSubmitting = signal(false);

  readonly isSearchingClient = signal(false);

  readonly clientFound = signal(false);


  // ==========================================
  // CART
  // ==========================================

  cartItems: CartItem[] = [];

  readonly deliveryFee = signal(50);


  // ==========================================
  // FORM
  // ==========================================

  readonly checkoutForm = this.fb.nonNullable.group({

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
        Validators.pattern(/^01[0125][0-9]{8}$/)
      ]
    ],

    email: [
      '',
      [
        Validators.email
      ]
    ],

    city: [
      '',
      [
      ]
    ],

    address: [
      '',
      [
        Validators.required,
        Validators.minLength(5)
      ]
    ],

    apartment: [''],

    notes: ['']

  });


  // ==========================================
  // INITIALIZE
  // ==========================================

  ngOnInit(): void {

    this.loadCart();

    this.watchPhoneNumber();

  }


  // ==========================================
  // LOAD CART
  // ==========================================

  private loadCart(): void {

    this.cartService.cartItems$
      .subscribe(items => {

        this.cartItems = items;

      });

  }


  // ==========================================
  // SEARCH CLIENT BY PHONE
  // ==========================================

  private watchPhoneNumber(): void {

    this.checkoutForm.controls.phone.valueChanges
      .pipe(

        debounceTime(400),

        distinctUntilChanged(),

        filter(phone =>
          phone.length === 11
        ),

        switchMap(phone => {

          this.isSearchingClient.set(true);

          return this.clientService
            .getByPhone(phone)
            .pipe(

              catchError(() => {

                this.clientFound.set(false);

                return of(null);

              })

            );

        })

      )
      .subscribe(client => {

        this.isSearchingClient.set(false);


        // ======================================
        // CLIENT NOT FOUND
        // ======================================

        if (!client) {

          this.clientFound.set(false);

          return;

        }


        // ======================================
        // CLIENT FOUND
        // ======================================

        this.clientFound.set(true);


        this.checkoutForm.patchValue({

          fullName: client.name,

          email: client.email ?? '',

          address: client.address ?? ''

        });

      });

  }


  // ==========================================
  // SUBTOTAL
  // ==========================================

  get subtotal(): number {

    return this.cartItems.reduce(
      (total, item) =>
        total +
        (item.product.price * item.quantity),
      0
    );

  }


  // ==========================================
  // TOTAL
  // ==========================================

  get total(): number {

    return this.subtotal +
      this.deliveryFee();

  }


  // ==========================================
  // TOTAL ITEMS
  // ==========================================

  get totalItems(): number {

    return this.cartItems.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  }


  // ==========================================
  // VALIDATION
  // ==========================================

  isInvalid(controlName: string): boolean {

    const control =
      this.checkoutForm.get(controlName);

    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched)
    );

  }


  // ==========================================
  // PLACE ORDER
  // ==========================================

  placeOrder(): void {

    // ----------------------------------------
    // Validate form
    // ----------------------------------------

    if (this.checkoutForm.invalid) {

      this.checkoutForm.markAllAsTouched();

      return;

    }


    // ----------------------------------------
    // Prevent double click
    // ----------------------------------------

    if (this.isSubmitting()) {

      return;

    }


    // ----------------------------------------
    // Check cart
    // ----------------------------------------

    if (this.cartItems.length === 0) {

      alert('Your cart is empty.');

      this.router.navigate(['/cart']);

      return;

    }


    this.isSubmitting.set(true);


    const form =
      this.checkoutForm.getRawValue();


    // ========================================
    // BUILD FULL ADDRESS
    // ========================================

    const fullAddress =
      this.buildFullAddress(
        form.city,
        form.address,
        form.apartment
      );


    // ========================================
    // BUILD ORDER REQUEST
    // ========================================

    const request = {

      client: {

        name: form.fullName,

        phoneNumber: form.phone,

        address: fullAddress,

        email: form.email || null

      },

      items: this.cartItems.map(item => ({

        productId: item.product.id,

        quantity: item.quantity

      }))

    };


    console.log(
      'Order request:',
      request
    );


    // ========================================
    // SEND TO API
    // ========================================

    this.orderService
      .createOrder(request)
      .subscribe({

        // ------------------------------------
        // SUCCESS
        // ------------------------------------

        next: response => {

          console.log(
            'Order created:',
            response
          );


          // Clear cart AFTER successful order
          this.cartService.clearCart();


          this.isSubmitting.set(false);


          // Go to success page
          this.router.navigate(
            ['/order-success']
          );

        },


        // ------------------------------------
        // ERROR
        // ------------------------------------

        error: error => {

          console.error(
            'Failed to create order:',
            error
          );


          this.isSubmitting.set(false);


          alert(
            error?.error?.message ??
            'Failed to place order. Please try again.'
          );

        }

      });

  }


  // ==========================================
  // BUILD ADDRESS
  // ==========================================

  private buildFullAddress(
    city: string,
    address: string,
    apartment: string
  ): string {

    let result =
      `${city}, ${address}`;


    if (apartment.trim()) {

      result +=
        `, ${apartment}`;

    }


    return result;

  }


  // ==========================================
  // BACK TO CART
  // ==========================================

  goBackToCart(): void {

    this.router.navigate(
      ['/cart']
    );

  }

}