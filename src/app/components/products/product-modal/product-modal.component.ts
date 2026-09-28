
import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';

import { CartService } from '../../../services/cart.service';
import { LanguageService } from '../../../services/language.service';

import { MaterialModule } from '../../../shared/AngularMaterial';

import { environment } from '../../../../environments/environment';

import { TranslatePipe } from '@ngx-translate/core';

import { Product } from '../../../models/product.model';
import { SubCategory } from '../../../models/subCategory.model';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { ProductService } from '../../../services/product.service';

import {
  Subject,
  takeUntil
} from 'rxjs';

import { RelativeProducts } from '../relative-products/relative-products';


@Component({
  selector: 'app-product-modal',

  standalone: true,

  imports: [
    TranslatePipe,
    CommonModule,
    FormsModule,
    MatButtonModule,
    MaterialModule,
    RelativeProducts
  ],

  templateUrl: './product-modal.component.html',

  styleUrl: './product-modal.component.css'
})
export class ProductModalComponent
  implements OnInit, OnDestroy {

  descriptionExpanded = true;


  // =====================================================
  // SERVICES
  // =====================================================

  private readonly router =
    inject(Router);

  private readonly route =
    inject(ActivatedRoute);

  private readonly productService =
    inject(ProductService);

  private readonly cartService =
    inject(CartService);

  readonly languageService =
    inject(LanguageService);


  // =====================================================
  // DESTROY
  // =====================================================

  private readonly destroy$ =
    new Subject<void>();


  // =====================================================
  // PRODUCT
  // =====================================================

  readonly product =
    signal<Product | null>(null);


  // =====================================================
  // QUANTITY
  // =====================================================

  readonly quantity =
    signal(1);


  // =====================================================
  // RELATIVE PRODUCT CART FEEDBACK
  // =====================================================

  readonly addedToCartProductId =
    signal<number | null>(null);

  readonly alreadyInCartProductId =
    signal<number | null>(null);

  private addedToCartTimer:
    ReturnType<typeof setTimeout> | null = null;

  private alreadyInCartMessageTimer:
    ReturnType<typeof setTimeout> | null = null;


  // =====================================================
  // IMAGE API
  // =====================================================

  readonly api =
    environment.imageApiBaseUrl;


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    /**
     * IMPORTANT:
     *
     * Do NOT use:
     *
     * route.snapshot.paramMap.get('id')
     *
     * because the same component can remain alive while
     * only the route ID changes.
     *
     * paramMap subscription detects:
     *
     * /products/10
     *        ↓
     * /products/20
     */

    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(params => {

        const productId =
          Number(params.get('id'));

        if (!productId) {

          this.goBack();

          return;
        }

        this.loadProduct(productId);
      });
  }


  // =====================================================
  // LOAD PRODUCT
  // =====================================================

  private loadProduct(
    id: number
  ): void {

    /**
     * Reset UI state immediately when changing products.
     */
    this.product.set(null);

    this.quantity.set(1);

    this.productService
      .getProduct(id)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({

        next: (product) => {
console.log(product)
          this.product.set(product);

        },

        error: () => {

          this.goBack();

        }

      });
  }


  // =====================================================
  // STOCK
  // =====================================================

 get stock(): number {
  const stockQuantity = Number(
    this.product()?.stockQuantity ?? 0
  );

  return stockQuantity > 0 ? stockQuantity : 5;
}


  get isOutOfStock(): boolean {

    return this.product()?.isInStock !== true;
  }


  get canAddToCart(): boolean {

    return (
      this.product()?.isInStock === true &&
      this.quantity() > 0
    );
  }


  // =====================================================
  // PRICE
  // =====================================================

  get hasDiscount(): boolean {

    return Number(
      this.product()?.discountPercentage ?? 0
    ) > 0;
  }


  get oldPrice(): number {

    return Number(
      this.product()?.price ?? 0
    );
  }


  get newPrice(): number {

    if (!this.hasDiscount) {

      return this.oldPrice;
    }

    const discount =
      Number(
        this.product()?.discountPercentage ?? 0
      );

    return Math.max(
      0,
      this.oldPrice -
      (
        this.oldPrice *
        discount /
        100
      )
    );
  }


  // =====================================================
  // QUANTITY
  // =====================================================

 
setQuantity(
  value: number
): void {

  let newQuantity =
    Number(value);

  if (!Number.isFinite(newQuantity)) {

    newQuantity = 1;
  }

  newQuantity =
    Math.floor(newQuantity);

  if (newQuantity < 1) {

    newQuantity = 1;
  }

  const maxQuantity =
    this.stock > 0
      ? this.stock
      : 5;

  if (newQuantity > maxQuantity) {

    newQuantity = maxQuantity;
  }
  this.quantity.set(
    newQuantity
  );
}



  validateQuantity(): void {

    this.setQuantity(
      this.quantity()
    );
  }


  // =====================================================
  // ADD CURRENT PRODUCT TO CART
  // =====================================================

  addToCart(): void {

    const product =
      this.product();
    if (!product?.isInStock) {

      return;
    }

    this.validateQuantity();

    var selectedQuantity =
      this.quantity();
    if (selectedQuantity <= 0) {

      return;
    }
if(selectedQuantity>this.stock)
{
  
  selectedQuantity=this.stock
}
    const added =
      this.cartService.replaceCartItem(
        product,
        selectedQuantity
      );
    if (!added) {

      return;
    }

    this.goBack();
  }


  // =====================================================
  // OPEN PRODUCT DETAILS
  // =====================================================

  openProductDetails(
    product: Product
  ): void {

    this.router.navigate([
      '/product',
      product.id
    ]);
  }


  // =====================================================
  // RELATIVE PRODUCT CLICK
  // =====================================================

  onRelativeProductClicked(
    product: Product
  ): void {

    this.router.navigate([
      '/product',
      product.id
    ]);
  }


  // =====================================================
  // RELATIVE PRODUCT ADD TO CART
  // =====================================================

  onRelativeAddToCartClicked(
    product: Product
  ): void {

    // ---------------------------------------------------
    // OUT OF STOCK
    // ---------------------------------------------------

    if (!product.isInStock) {

      return;
    }

    // ---------------------------------------------------
    // ADD PRODUCT
    //
    // Same behavior as Home:
    //
    // true  = added successfully
    // false = already in cart
    // ---------------------------------------------------

    const alreadyExists =
      this.cartService.addToCart(
        product
      );


    // ---------------------------------------------------
    // PRODUCT ALREADY EXISTS
    // ---------------------------------------------------

    if (!alreadyExists) {

      this.addedToCartProductId.set(
        null
      );

      this.showAlreadyInCartMessage(
        product.id
      );

      return;
    }


    // ---------------------------------------------------
    // PRODUCT ADDED SUCCESSFULLY
    // ---------------------------------------------------

    this.alreadyInCartProductId.set(
      null
    );

    this.showAddedToCartSuccess(
      product.id
    );
  }


  // =====================================================
  // SHOW ADDED SUCCESS
  // =====================================================

  private showAddedToCartSuccess(
    productId: number
  ): void {

    // Clear previous timer

    if (this.addedToCartTimer) {

      clearTimeout(
        this.addedToCartTimer
      );
    }


    // Show check mark

    this.addedToCartProductId.set(
      productId
    );


    // Hide after 1.5 seconds

    this.addedToCartTimer =
      setTimeout(() => {

        if (
          this.addedToCartProductId() ===
          productId
        ) {

          this.addedToCartProductId.set(
            null
          );
        }

      }, 1500);
  }


  // =====================================================
  // SHOW ALREADY IN CART
  // =====================================================

  private showAlreadyInCartMessage(
    productId: number
  ): void {

    // Clear previous timer

    if (
      this.alreadyInCartMessageTimer
    ) {

      clearTimeout(
        this.alreadyInCartMessageTimer
      );
    }


    // Show message

    this.alreadyInCartProductId.set(
      productId
    );


    // Hide after 3 seconds

    this.alreadyInCartMessageTimer =
      setTimeout(() => {

        if (
          this.alreadyInCartProductId() ===
          productId
        ) {

          this.alreadyInCartProductId.set(
            null
          );
        }

      }, 3000);
  }


  // =====================================================
  // GO BACK
  // =====================================================

  goBack(): void {

    this.router.navigate([
      '/products'
    ]);
  }


  // =====================================================
  // IMAGE URL
  // =====================================================

  getImageUrl(
    imageUrl?: string | null
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

    return `${this.api}${imageUrl}`;
  }


  // =====================================================
  // PRODUCT NAME
  // =====================================================

  getProductName(): string {

    const product =
      this.product();

    if (!product) {

      return '';
    }

    if (
      this.languageService.isArabic()
    ) {

      return (
        product.nameAr?.trim() ||
        product.nameEn?.trim() ||
        'Product'
      );
    }

    return (
      product.nameEn?.trim() ||
      product.nameAr?.trim() ||
      'Product'
    );
  }


  // =====================================================
  // PRODUCT DESCRIPTION
  // =====================================================

  getProductDescription(): string {

    const product =
      this.product();

    if (!product) {

      return '';
    }

    if (
      this.languageService.isArabic()
    ) {

      return (
        product.descriptionAr?.trim() ||
        product.descriptionEn?.trim() ||
        ''
      );
    }

    return (
      product.descriptionEn?.trim() ||
      product.descriptionAr?.trim() ||
      ''
    );
  }


  // =====================================================
  // CATEGORY NAME
  // =====================================================

  getCategoryName(): string {

    const product =
      this.product();

    const subCategory =
      product?.subCategories?.[0];

    if (!subCategory) {

      return '';
    }

    if (
      this.languageService.isArabic()
    ) {

      return (
        subCategory.categoryNameAr?.trim() ||
        subCategory.categoryNameEn?.trim() ||
        ''
      );
    }

    return (
      subCategory.categoryNameEn?.trim() ||
      subCategory.categoryNameAr?.trim() ||
      ''
    );
  }


  // =====================================================
  // SUBCATEGORY NAME
  // =====================================================

  getSubCategoryName(
    subCategory: SubCategory
  ): string {

    if (
      this.languageService.isArabic()
    ) {

      return (
        subCategory?.nameAr?.trim() ||
        subCategory?.nameEn?.trim() ||
        ''
      );
    }

    return (
      subCategory?.nameEn?.trim() ||
      subCategory?.nameAr?.trim() ||
      ''
    );
  }


  // =====================================================
  // BRAND NAME
  // =====================================================

  getBrandName(): string {

    const brand =
      this.product()?.brand;

    if (!brand) {

      return '';
    }

    if (
      this.languageService.isArabic()
    ) {

      return (
        brand.nameAr?.trim() ||
        brand.nameEn?.trim() ||
        ''
      );
    }

    return (
      brand.nameEn?.trim() ||
      brand.nameAr?.trim() ||
      ''
    );
  }


  // =====================================================
  // DESTROY
  // =====================================================

  ngOnDestroy(): void {

    this.destroy$.next();

    this.destroy$.complete();


    // Clear success timer

    if (this.addedToCartTimer) {

      clearTimeout(
        this.addedToCartTimer
      );
    }


    // Clear already-in-cart timer

    if (
      this.alreadyInCartMessageTimer
    ) {

      clearTimeout(
        this.alreadyInCartMessageTimer
      );
    }
  }
}
