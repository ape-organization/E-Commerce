import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from '../models/product.model';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItems.asObservable();

  private cartCount = new BehaviorSubject<number>(0);
  public cartCount$ = this.cartCount.asObservable();

  constructor() {
    this.loadCartFromLocalStorage();
  }

  addToCart(product: Product, quantity: number = 1): void {
    const currentCart = this.cartItems.value;
    const existingItem = currentCart.find(item => item.product.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      currentCart.push({ product, quantity });
    }

    this.cartItems.next([...currentCart]);
    this.updateCartCount();
    this.saveCartToLocalStorage();
  }

  removeFromCart(productId: number): void {
    const currentCart = this.cartItems.value.filter(item => item.product.id !== productId);
    this.cartItems.next(currentCart);
    this.updateCartCount();
    this.saveCartToLocalStorage();
  }

  updateQuantity(productId: number, quantity: number): void {
    const currentCart = this.cartItems.value;
    const item = currentCart.find(ci => ci.product.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        this.cartItems.next([...currentCart]);
        this.saveCartToLocalStorage();
      }
    }
    this.updateCartCount();
  }

  clearCart(): void {
    this.cartItems.next([]);
    this.updateCartCount();
    this.saveCartToLocalStorage();
  }

  getCartTotal(): number {
    return this.cartItems.value.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  }

  getCartItems(): CartItem[] {
    return this.cartItems.value;
  }

  private updateCartCount(): void {
//    const count = this.cartItems.value.reduce((sum, item) => sum + item.quantity, 0);
    const count = this.cartItems.value.length;

    this.cartCount.next(count);
  }

  private saveCartToLocalStorage(): void {
    localStorage.setItem('cart', JSON.stringify(this.cartItems.value));
  }

  private loadCartFromLocalStorage(): void {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        this.cartItems.next(JSON.parse(saved));
        this.updateCartCount();
      } catch (e) {
        console.error('Error loading cart from localStorage', e);
      }
    }
  }
}
