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
// localStorage stores ONLY:
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
// This is what Checkout sends to the backend.
//
// Price is NOT sent from the frontend.
// The backend calculates the final price.
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
  //
  // Returns:
  //
  // true  = product successfully added
  // false = product already exists / invalid
  //
  // IMPORTANT:
  //
  // If the product already exists:
  //
  // - Do NOT add it again
  // - Do NOT increase quantity
  // - Do NOT change existing quantity
  //
  // ==========================================================

  addToCart(
    product: Product,
    quantity: number = 1
  ): boolean {
console.log(quantity)
    // --------------------------------------------------------
    // INVALID PRODUCT
    // --------------------------------------------------------

    if (!product?.id) {

      return false;

    }


    // --------------------------------------------------------
    // PRODUCT NOT AVAILABLE
    // --------------------------------------------------------

    if (!product.isInStock) {

      return false;

    }


    // --------------------------------------------------------
    // NORMALIZE QUANTITY
    // --------------------------------------------------------

    quantity =
      this.normalizeQuantity(
        quantity
      );


    if (quantity <= 0) {

      return false;

    }


    // --------------------------------------------------------
    // CURRENT CART
    // --------------------------------------------------------

    const currentCart = [
      ...this.cartItems.value
    ];


    // --------------------------------------------------------
    // CHECK IF PRODUCT ALREADY EXISTS
    // --------------------------------------------------------

    const existingItem =
      currentCart.find(
        item =>
          item.product.id === product.id
      );


    if (existingItem) {

      // IMPORTANT:
      //
      // Do NOT increase quantity.
      // Do NOT modify the existing item.
      //
      return false;

    }


    // --------------------------------------------------------
    // NEW PRODUCT
    // --------------------------------------------------------

    currentCart.push({

      product,

      quantity

    });


    // --------------------------------------------------------
    // SAVE CART
    // --------------------------------------------------------

    this.setCart(
      currentCart
    );


    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    return true;

  }
replaceCartItem(product: Product, quantity: number): boolean {
  if (!product?.id) {
    return false;
  }

  if (product.isInStock !== true) {
    return false;
  }

  quantity = this.normalizeQuantity(quantity);

  if (quantity <= 0) {
    return false;
  }

  const currentCart = this.cartItems.value.filter(
    item => item.product.id !== product.id
  );

  currentCart.push({
    product,
    quantity
  });

  this.setCart(currentCart);

  return true;
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
      this.normalizeQuantity(
        quantity
      );


    // --------------------------------------------------------
    // ZERO / INVALID QUANTITY
    // --------------------------------------------------------

    if (quantity <= 0) {

      this.removeFromCart(
        productId
      );

      return;

    }


    const currentCart =
      [
        ...this.cartItems.value
      ];


    const item =
      currentCart.find(
        cartItem =>
          cartItem.product.id === productId
      );


    // --------------------------------------------------------
    // PRODUCT NOT FOUND
    // --------------------------------------------------------

    if (!item) {

      return;

    }


    // --------------------------------------------------------
    // PRODUCT NO LONGER IN STOCK
    // --------------------------------------------------------

    if (!item.product.isInStock) {

      this.removeFromCart(
        productId
      );

      return;

    }


    // --------------------------------------------------------
    // UPDATE QUANTITY
    // --------------------------------------------------------

    item.quantity =
      quantity;


    // --------------------------------------------------------
    // SAVE CART
    // --------------------------------------------------------

    this.setCart(
      currentCart
    );

  }


  // ==========================================================
  // INCREASE QUANTITY
  // ==========================================================

  increaseQuantity(
    productId: number
  ): void {

    const item =
      this.cartItems.value.find(
        cartItem =>
          cartItem.product.id === productId
      );


    if (!item) {

      return;

    }


    this.updateQuantity(
      productId,
      item.quantity + 1
    );

  }


  // ==========================================================
  // DECREASE QUANTITY
  // ==========================================================

  decreaseQuantity(
    productId: number
  ): void {

    const item =
      this.cartItems.value.find(
        cartItem =>
          cartItem.product.id === productId
      );


    if (!item) {

      return;

    }


    this.updateQuantity(
      productId,
      item.quantity - 1
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

  getProductIds(): number[] {

    return this.cartItems.value
      .map(
        item =>
          item.product.id
      )
      .filter(
        id =>
          id > 0
      );

  }


  // ==========================================================
  // GET ORDER ITEMS
  // ==========================================================
  //
  // Example:
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
  // NO PRICE
  // NO DISCOUNT
  //
  // Backend calculates the final price.
  //
  // ==========================================================

  getOrderItems(): OrderItemRequest[] {

    return this.cartItems.value
      .map(
        item => ({

          productId:
            item.product.id,

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


  // ==========================================================
  // GET CART TOTAL
  // ==========================================================

  getCartTotal(): number {

    const total =
      this.cartItems.value.reduce(
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


    return this.roundPrice(
      total
    );

  }


  // ==========================================================
  // GET FINAL PRODUCT PRICE
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

      return this.roundPrice(
        price
      );

    }


    const finalPrice =
      Math.max(
        0,
        price -
        (
          price *
          discount /
          100
        )
      );


    return this.roundPrice(
      finalPrice
    );

  }


  // ==========================================================
  // GET ITEM TOTAL
  // ==========================================================

  getItemTotal(
    item: CartItem
  ): number {

    const price =
      this.getFinalPrice(
        item.product
      );


    return this.roundPrice(
      price *
      item.quantity
    );

  }


  // ==========================================================
  // REFRESH CART FROM API
  // ==========================================================
  //
  // localStorage contains only:
  //
  // productId + quantity
  //
  // Product information is retrieved from API.
  //
  // ==========================================================

  refreshCartFromApi():
    Observable<CartItem[]> {

    const storedItems =
      this.readStoredCart();


    // --------------------------------------------------------
    // EMPTY CART
    // --------------------------------------------------------

    if (
      storedItems.length === 0
    ) {

      this.cartItems.next([]);

      this.updateCartCount();

      return of([]);

    }


    // --------------------------------------------------------
    // PRODUCT IDS
    // --------------------------------------------------------

    const productIds =
      storedItems.map(
        item =>
          item.productId
      );


    this.cartLoading.next(true);


    // --------------------------------------------------------
    // LOAD PRODUCTS
    // --------------------------------------------------------

    return this.productService
      .getProductsByIds(
        productIds
      )
      .pipe(

        // ----------------------------------------------------
        // BUILD VALID CART
        // ----------------------------------------------------

        map(
          products => {

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


              // Product no longer exists
              if (!product) {

                continue;

              }


              // Product no longer available
              if (!product.isInStock) {

                continue;

              }


              const quantity =
                this.normalizeQuantity(
                  storedItem.quantity
                );


              if (
                quantity <= 0
              ) {

                continue;

              }


              validCart.push({

                product,

                quantity

              });

            }


            return validCart;

          }
        ),


        // ----------------------------------------------------
        // UPDATE CART
        // ----------------------------------------------------

        tap(
          validCart => {

            this.cartItems.next(
              validCart
            );


            this.updateCartCount();


            this.saveCartToStorage(
              validCart
            );

          }
        ),


        // ----------------------------------------------------
        // ERROR
        // ----------------------------------------------------

        catchError(
          error => {

            console.error(
              'Error refreshing cart:',
              error
            );


            return of(
              this.cartItems.value
            );

          }
        ),


        // ----------------------------------------------------
        // FINISH LOADING
        // ----------------------------------------------------

        finalize(
          () => {

            this.cartLoading.next(
              false
            );

          }
        )

      );

  }


  // ==========================================================
  // SET CART
  // ==========================================================

  private setCart(
    items: CartItem[]
  ): void {

    const cart =
      [
        ...items
      ];


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
      items.map(
        item => ({

          productId:
            item.product.id,

          quantity:
            item.quantity

        })
      );


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
        JSON.parse(
          saved
        );


      // ------------------------------------------------------
      // INVALID FORMAT
      // ------------------------------------------------------

      if (
        !Array.isArray(parsed)
      ) {

        this.removeCartFromStorage();

        return [];

      }


      // ------------------------------------------------------
      // NEW FORMAT
      // ------------------------------------------------------
      //
      // {
      //   productId: 1,
      //   quantity: 2
      // }
      //
      // ------------------------------------------------------

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


      // ------------------------------------------------------
      // OLD FORMAT MIGRATION
      // ------------------------------------------------------
      //
      // {
      //   product: {
      //     id: 1
      //   },
      //   quantity: 2
      // }
      //
      // ------------------------------------------------------

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


      // ------------------------------------------------------
      // UNKNOWN FORMAT
      // ------------------------------------------------------

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
        JSON.stringify(
          items
        )
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
  //
  // IMPORTANT:
  //
  // Count means total quantity.
  //
  // Example:
  //
  // Product A = 2
  // Product B = 3
  //
  // cartCount = 5
  //
  // ==========================================================

  private updateCartCount(): void {

    const count =
      this.cartItems.value.reduce(
        (
          total,
          item
        ) =>
          total +
          item.quantity,
        0
      );


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
      Number(
        value
      );


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


  // ==========================================================
  // ROUND PRICE
  // ==========================================================

  private roundPrice(
    value: number
  ): number {

    return Math.round(
      (
        Number(value) +
        Number.EPSILON
      ) *
      100
    ) / 100;

  }

}