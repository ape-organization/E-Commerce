import {
  Component,
  Inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';

import { CartService } from '../../../services/cart.service';
import { LanguageService } from '../../../services/language.service';

import { MaterialModule } from '../../../shared/AngularMaterial';

import { environment } from '../../../../environments/environment';

import { TranslatePipe } from '@ngx-translate/core';

import { Product } from '../../../models/product.model';
import { SubCategory } from '../../../models/subCategory.model';


@Component({
  selector: 'app-product-modal',

  standalone: true,

  imports: [
    TranslatePipe,
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MaterialModule
  ],

  templateUrl: './product-modal.component.html',

  styleUrl: './product-modal.component.css'
})
export class ProductModalComponent {


  // =====================================================
  // QUANTITY
  // =====================================================

  quantity = signal(1);


  // =====================================================
  // IMAGE API
  // =====================================================

  api = environment.imageApiBaseUrl;


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    public dialogRef:
      MatDialogRef<ProductModalComponent>,

    @Inject(MAT_DIALOG_DATA)
    public product: Product,

    private cartService: CartService,

    public languageService: LanguageService
  ) {}


  // =====================================================
  // STOCK
  // =====================================================

  get stock(): number {

    return Number(
      this.product?.stockQuantity ?? 0
    );

  }


  get isOutOfStock(): boolean {

    return this.product?.isInStock !== true;

  }


  get canAddToCart(): boolean {

    return (
      this.product?.isInStock === true &&
      this.quantity() > 0 &&
      (this.stock <= 0 || this.quantity() <= this.stock)
    );

  }


  // =====================================================
  // PRICE
  // =====================================================

  get hasDiscount(): boolean {

    return Number(
      this.product?.discountPercentage ?? 0
    ) > 0;

  }


  get oldPrice(): number {

    return Number(
      this.product?.price ?? 0
    );

  }


  get newPrice(): number {

    if (!this.hasDiscount) {

      return this.oldPrice;

    }

    const discount =
      Number(
        this.product?.discountPercentage ?? 0
      );

    return Math.max(
      0,
      this.oldPrice -
      (this.oldPrice * discount / 100)
    );

  }


  // =====================================================
  // QUANTITY
  // =====================================================

  setQuantity(value: number): void {

    let newQuantity = Number(value);

    if (!Number.isFinite(newQuantity)) {

      newQuantity = 0;

    }

    newQuantity = Math.floor(newQuantity);

    if (newQuantity < 0) {

      newQuantity = 0;

    }

    if (
      this.stock > 0 &&
      newQuantity > this.stock
    ) {

      newQuantity = this.stock;

    }

    this.quantity.set(newQuantity);

  }


  validateQuantity(): void {

    this.setQuantity(
      this.quantity()
    );

  }


  // =====================================================
  // ADD TO CART
  // =====================================================

 addToCart(): void {
  if (!this.product?.isInStock) {
    return;
  }

  this.validateQuantity();

  const selectedQuantity = this.quantity();

  if (selectedQuantity <= 0) {
    return;
  }

  const added = this.cartService.replaceCartItem(
    this.product,
    selectedQuantity
  );

  if (!added) {
    return;
  }

  this.dialogRef.close();
}


  // =====================================================
  // CLOSE
  // =====================================================

  closeDialog(): void {

    this.dialogRef.close();

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

    if (
      this.languageService.isArabic()
    ) {

      return (
        this.product?.nameAr?.trim() ||
        this.product?.nameEn?.trim() ||
        'Product'
      );

    }

    return (
      this.product?.nameEn?.trim() ||
      this.product?.nameAr?.trim() ||
      'Product'
    );

  }


  // =====================================================
  // PRODUCT DESCRIPTION
  // =====================================================

  getProductDescription(): string {

    if (
      this.languageService.isArabic()
    ) {

      return (
        this.product?.descriptionAr?.trim() ||
        this.product?.descriptionEn?.trim() ||
        ''
      );

    }

    return (
      this.product?.descriptionEn?.trim() ||
      this.product?.descriptionAr?.trim() ||
      ''
    );

  }


  // =====================================================
  // CATEGORY NAME
  // =====================================================

  getCategoryName(): string {

    const subCategory =
      this.product?.subCategories?.[0];

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
      this.product?.brand;

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

}