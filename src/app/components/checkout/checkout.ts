import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {

 private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);

  // Replace this later with your CartService
  readonly cartItems = signal([
    {
      id: 1,
      name: 'Luxury Face Cream',
      price: 350,
      quantity: 1,
      image: 'assets/images/products/face-cream.jpg'
    },
    {
      id: 2,
      name: 'Rose Glow Serum',
      price: 450,
      quantity: 2,
      image: 'assets/images/products/serum.jpg'
    }
  ]);

  readonly deliveryFee = signal(50);

  readonly checkoutForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],

    phone: [
      '',
      [
        Validators.required,
        Validators.pattern(/^01[0125][0-9]{8}$/)
      ]
    ],

    email: [
      '',
      [Validators.email]
    ],

    city: [
      '',
      [Validators.required]
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

  get subtotal(): number {
    return this.cartItems().reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }

  get total(): number {
    return this.subtotal + this.deliveryFee();
  }

  get totalItems(): number {
    return this.cartItems().reduce(
      (total, item) => total + item.quantity,
      0
    );
  }

  isInvalid(controlName: string): boolean {
    const control = this.checkoutForm.get(controlName);

    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched)
    );
  }

  placeOrder(): void {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    const order = {
      customer: this.checkoutForm.getRawValue(),

      paymentMethod: 'cash_on_delivery',

      items: this.cartItems(),

      subtotal: this.subtotal,

      deliveryFee: this.deliveryFee(),

      total: this.total
    };

    console.log('Order:', order);

    /*
      Call your API here:

      this.orderService.createOrder(order).subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.router.navigate(['/order-success']);
        },
        error: () => {
          this.isSubmitting.set(false);
        }
      });
    */

    // Temporary
    setTimeout(() => {
      this.isSubmitting.set(false);

      this.router.navigate(['/order-success']);
    }, 1000);
  }

  goBackToCart(): void {
    this.router.navigate(['/cart']);
  }
}
