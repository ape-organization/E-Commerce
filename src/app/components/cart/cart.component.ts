import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { CartService, CartItem } from '../../services/cart.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  cartTotal: number = 0;
private readonly router = inject(Router);
  constructor(
    private cartService: CartService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.cartTotal = this.cartService.getCartTotal();
    });
  }

  removeFromCart(productId: number) {
    this.cartService.removeFromCart(productId);
  }

  updateQuantity(productId: number, quantity: number) {
    if (quantity > 0) {
      this.cartService.updateQuantity(productId, quantity);
    }
  }

  clearCart() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Clear Cart',
        message: 'Are you sure you want to clear the cart?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cartService.clearCart();
      }
    });
  }

  sendToWhatsApp() {
    if (this.cartItems.length === 0) {
      alert('Cart is empty!');
      return;
    }

    const message = this.generateCartMessage();
    const phoneNumber = '1211849330';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  sendToEmail() {
    if (this.cartItems.length === 0) {
      alert('Cart is empty!');
      return;
    }

    const message = this.generateCartMessage();
    const subject = 'Pharmacy Order';
    const email = 'orders@pharmacy.com';
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.location.href = mailtoUrl;
  }
goToCheckout(): void {
  this.router.navigate(['/checkout']);
}
  private generateCartMessage(): string {
    let message = 'Pharmacy Order:\n\n';
    this.cartItems.forEach((item, index) => {
      message += `${index + 1}. ${item.product.name}\n`;
      message += `   Price: ${item.product.price}\n`;
      message += `   Quantity: ${item.quantity}\n`;
      message += `   Subtotal: ${(item.product.price * item.quantity).toFixed(2)}\n\n`;
    });
    message += `\nTotal: ${this.cartTotal.toFixed(2)}`;
    return message;
  }
}
