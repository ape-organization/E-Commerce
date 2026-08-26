import { Injectable } from '@angular/core';

import {
  BehaviorSubject,
  Observable,
  of
} from 'rxjs';

import {
  catchError,
  finalize,
  map,
  tap
} from 'rxjs/operators';

import { Product } from '../models/product.model';
import { ProductService } from './product.service';


// ============================================================
// STORED CART ITEM
// ============================================================
//
// localStorage is used ONLY to remember:
//
// productId
// quantity
//
// The Product itself always comes from the API.
//
// ============================================================

export interface StoredCartItem {

  productId: number;

  quantity: number;

}


// ============================================================
// CART ITEM
// ============================================================

export interface CartItem {

  product: Product;

  quantity: number;

}


// ============================================================
// ORDER ITEM
// ============================================================
//
// This is the exact structure expected by:
//
// CreateOrderItemDto
//
// ============================================================

export interface OrderItemRequest {

  productId: number;

  quantity: number;

}


// ============================================================
// CART SERVICE
// ============================================================

@Injectable({
  providedIn: 'root'
})
export class CartService {

  // ==========================================================
  // LOCAL STORAGE KEY
  // ==========================================================

  private readonly CART_STORAGE_KEY = 'cart';


  // ==========================================================
  // CART ITEMS
  // ==========================================================

  private cartItems =
    new BehaviorSubject<CartItem[]>([]);

  public cartItems$ =
    this.cartItems.asObservable();


  // ==========================================================
  // CART COUNT
  // ==========================================================

  private cartCount =
    new BehaviorSubject<number>(0);

  public cartCount$ =
    this.cartCount.asObservable();


  // ==========================================================
  // CART LOADING
  // ==========================================================

  private cartLoading =
    new BehaviorSubject<boolean>(false);

  public cartLoading$ =
    this.cartLoading.asObservable();


  // ==========================================================
  // CONSTRUCTOR
  // ==========================================================

  constructor(
    private productService: ProductService
  ) {

    this.initializeCart();

  }


  // ==========================================================
  // INITIALIZE CART
  // ==========================================================

  private initializeCart(): void {

    const storedItems =
      this.readStoredCart();


    if (storedItems.length === 0) {

      this.cartItems.next([]);

      this.updateCartCount();

      return;

    }


    this.refreshCartFromApi()
      .subscribe();

  }


  // ==========================================================
  // ADD TO CART
  // ==========================================================

  addToCart(
    product: Product,
    quantity: number = 1
  ): void {

    if (!product) {
      return;
    }


    if (!product.id) {
      return;
    }


    if (!product.isInStock) {
      return;
    }


    quantity =
      this.normalizeQuantity(quantity);


    if (quantity <= 0) {
      return;
    }


    const stock =
      Number(
        product.stockQuantity ?? 0
      );


    if (
      stock > 0 &&
      quantity > stock
    ) {

      quantity = stock;

    }


    if (quantity <= 0) {
      return;
    }


    const currentCart =
      [...this.cartItems.value];


    const existingItem =
      currentCart.find(
        item =>
          item.product.id === product.id
      );


    // ========================================================
    // EXISTING PRODUCT
    // ========================================================

    if (existingItem) {

      let newQuantity =
        existingItem.quantity +
        quantity;


      if (
        stock > 0 &&
        newQuantity > stock
      ) {

        newQuantity = stock;

      }


      existingItem.quantity =
        newQuantity;

    }


    // ========================================================
    // NEW PRODUCT
    // ========================================================

    else {

      currentCart.push({

        product,

        quantity

      });

    }


    this.setCart(
      currentCart
    );

  }


  // ==========================================================
  // REMOVE FROM CART
  // ==========================================================

  removeFromCart(
    productId: number
  ): void {

    const updatedCart =
      this.cartItems.value.filter(
        item =>
          item.product.id !== productId
      );


    this.setCart(
      updatedCart
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
      this.normalizeQuantity(quantity);


    if (quantity <= 0) {

      this.removeFromCart(
        productId
      );

      return;

    }


    const currentCart =
      [...this.cartItems.value];


    const item =
      currentCart.find(
        cartItem =>
          cartItem.product.id === productId
      );


    if (!item) {
      return;
    }


    if (!item.product.isInStock) {

      this.removeFromCart(
        productId
      );

      return;

    }


    const stock =
      Number(
        item.product.stockQuantity ?? 0
      );


    if (
      stock > 0 &&
      quantity > stock
    ) {

      quantity = stock;

    }


    if (quantity <= 0) {

      this.removeFromCart(
        productId
      );

      return;

    }


    item.quantity =
      quantity;


    this.setCart(
      currentCart
    );

  }


  // ==========================================================
  // CLEAR CART
  // ==========================================================

  clearCart(): void {

    this.cartItems.next([]);

    this.updateCartCount();

    this.removeCartFromStorage();

  }


  // ==========================================================
  // GET CART ITEMS
  // ==========================================================

  getCartItems(): CartItem[] {

    return [
      ...this.cartItems.value
    ];

  }


  // ==========================================================
  // GET PRODUCT IDS
  // ==========================================================
  //
  // IMPORTANT:
  //
  // This is what Checkout uses.
  //
  // It does NOT read localStorage.
  //
  // It gets the IDs from the current cart.
  //
  // ==========================================================

  getProductIds(): number[] {

    return this.cartItems.value
      .map(item => item.product.id)
      .filter(id => id > 0);

  }


  // ==========================================================
  // GET ORDER ITEMS
  // ==========================================================
  //
  // Returns exactly:
  //
  // [
  //   {
  //     productId: 12,
  //     quantity: 2
  //   },
  //   {
  //     productId: 25,
  //     quantity: 1
  //   }
  // ]
  //
  // ==========================================================

  getOrderItems(): OrderItemRequest[] {

    return this.cartItems.value
      .map(item => ({

        productId:
          item.product.id,

        quantity:
          this.normalizeQuantity(
            item.quantity
          )

      }))
      .filter(item =>
        item.productId > 0 &&
        item.quantity > 0
      );

  }


  // ==========================================================
  // GET CART TOTAL
  // ==========================================================

  getCartTotal(): number {

    return this.cartItems.value.reduce(
      (
        total,
        item
      ) => {

        const price =
          this.getFinalPrice(
            item.product
          );


        return total +
          (
            price *
            item.quantity
          );

      },
      0
    );

  }


  // ==========================================================
  // GET FINAL PRICE
  // ==========================================================

  getFinalPrice(
    product: Product
  ): number {

    const price =
      Number(
        product.price ?? 0
      );


    const discount =
      Number(
        product.discountPercentage ?? 0
      );


    if (
      discount <= 0
    ) {

      return price;

    }


    return Math.max(
      0,
      price -
      (
        price *
        discount /
        100
      )
    );

  }


  // ==========================================================
  // REFRESH CART FROM API
  // ==========================================================

  refreshCartFromApi():
    Observable<CartItem[]> {

    const storedItems =
      this.readStoredCart();


    if (
      storedItems.length === 0
    ) {

      this.cartItems.next([]);

      this.updateCartCount();

      return of([]);

    }


    const productIds =
      storedItems.map(
        item =>
          item.productId
      );


    this.cartLoading.next(true);


    return this.productService
      .getProductsByIds(productIds)
      .pipe(

        map(products => {

          const validCart:
            CartItem[] = [];


          for (
            const storedItem
            of storedItems
          ) {

            const product =
              products.find(
                p =>
                  p.id ===
                  storedItem.productId
              );


            if (!product) {
              continue;
            }


            if (!product.isInStock) {
              continue;
            }


            let quantity =
              this.normalizeQuantity(
                storedItem.quantity
              );


            if (quantity <= 0) {
              continue;
            }


            const stock =
              Number(
                product.stockQuantity ?? 0
              );


            if (
              stock > 0 &&
              quantity > stock
            ) {

              quantity = stock;

            }


            if (quantity <= 0) {
              continue;
            }


            validCart.push({

              product,

              quantity

            });

          }


          return validCart;

        }),


        tap(validCart => {

          this.cartItems.next(
            validCart
          );


          this.updateCartCount();


          this.saveCartToStorage(
            validCart
          );

        }),


        catchError(error => {

          console.error(
            'Error refreshing cart:',
            error
          );


          return of(
            this.cartItems.value
          );

        }),


        finalize(() => {

          this.cartLoading.next(false);

        })

      );

  }


  // ==========================================================
  // SET CART
  // ==========================================================

  private setCart(
    items: CartItem[]
  ): void {

    const cart =
      [...items];


    this.cartItems.next(
      cart
    );


    this.updateCartCount();


    this.saveCartToStorage(
      cart
    );

  }


  // ==========================================================
  // SAVE CART
  // ==========================================================

  private saveCartToStorage(
    items: CartItem[]
  ): void {

    const storedItems:
      StoredCartItem[] =
      items.map(item => ({

        productId:
          item.product.id,

        quantity:
          item.quantity

      }));


    try {

      localStorage.setItem(
        this.CART_STORAGE_KEY,
        JSON.stringify(
          storedItems
        )
      );

    }

    catch (error) {

      console.error(
        'Error saving cart:',
        error
      );

    }

  }


  // ==========================================================
  // READ CART FROM LOCAL STORAGE
  // ==========================================================

  private readStoredCart():
    StoredCartItem[] {

    const saved =
      localStorage.getItem(
        this.CART_STORAGE_KEY
      );


    if (!saved) {
      return [];
    }


    try {

      const parsed =
        JSON.parse(saved);


      if (
        !Array.isArray(parsed)
      ) {

        this.removeCartFromStorage();

        return [];

      }


      const newFormat =
        parsed.every(
          item =>
            item &&
            typeof item.productId === 'number'
        );


      if (newFormat) {

        return parsed
          .map(
            item => ({

              productId:
                Number(
                  item.productId
                ),

              quantity:
                this.normalizeQuantity(
                  item.quantity
                )

            })
          )
          .filter(
            item =>
              item.productId > 0 &&
              item.quantity > 0
          );

      }


      // ======================================================
      // OLD FORMAT MIGRATION
      // ======================================================

      const oldFormat =
        parsed.every(
          item =>
            item &&
            item.product &&
            typeof item.product.id === 'number'
        );


      if (oldFormat) {

        const migrated:
          StoredCartItem[] =
          parsed
            .map(
              item => ({

                productId:
                  Number(
                    item.product.id
                  ),

                quantity:
                  this.normalizeQuantity(
                    item.quantity
                  )

              })
            )
            .filter(
              item =>
                item.productId > 0 &&
                item.quantity > 0
            );


        this.saveStoredCart(
          migrated
        );


        return migrated;

      }


      this.removeCartFromStorage();

      return [];

    }

    catch (error) {

      console.error(
        'Error reading cart:',
        error
      );


      this.removeCartFromStorage();

      return [];

    }

  }


  // ==========================================================
  // SAVE STORED CART
  // ==========================================================

  private saveStoredCart(
    items: StoredCartItem[]
  ): void {

    try {

      localStorage.setItem(
        this.CART_STORAGE_KEY,
        JSON.stringify(items)
      );

    }

    catch (error) {

      console.error(
        'Error saving migrated cart:',
        error
      );

    }

  }


  // ==========================================================
  // REMOVE LOCAL STORAGE
  // ==========================================================

  private removeCartFromStorage(): void {

    localStorage.removeItem(
      this.CART_STORAGE_KEY
    );

  }


  // ==========================================================
  // CART COUNT
  // ==========================================================

  private updateCartCount(): void {

    const count =
      this.cartItems.value.length;


    this.cartCount.next(
      count
    );

  }


  // ==========================================================
  // NORMALIZE QUANTITY
  // ==========================================================

  private normalizeQuantity(
    value: number
  ): number {

    const quantity =
      Number(value);


    if (
      !Number.isFinite(quantity)
    ) {

      return 0;

    }


    if (
      quantity <= 0
    ) {

      return 0;

    }


    return Math.floor(
      quantity
    );

  }

}