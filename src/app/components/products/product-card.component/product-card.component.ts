import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { Product } from '../../../models/product.model';

import { MaterialModule } from '../../../shared/AngularMaterial';

import { TranslatePipe } from '@ngx-translate/core';

import { LanguageService } from '../../../services/language.service';


@Component({
  selector: 'app-product-card',

  standalone: true,

  imports: [
    CommonModule,
    MaterialModule,
    TranslatePipe
  ],

  templateUrl: './product-card.component.html',

  styleUrls: [
    './product-card.component.scss'
  ]
})
export class ProductCardComponent {

  @Input({ required: true })
  product!: Product;

  @Input()
  imageApi = '';

  @Output()
  productClicked =
    new EventEmitter<Product>();

  @Output()
  addToCartClicked =
    new EventEmitter<Product>();

@Input()
showAlreadyInCartMessage = false;
  constructor(
    public languageService: LanguageService
  ) {}


  // ========================================================
  // PRODUCT NAME
  // ========================================================

  getProductName(): string {

    if (this.languageService.isArabic()) {

      return (
        this.product?.nameAr?.trim() ||
        this.product?.nameEn ||
        'Product'
      );
    }

    return (
      this.product?.nameEn?.trim() ||
      this.product?.nameAr ||
      'Product'
    );
  }


  // ========================================================
  // IMAGE URL
  // ========================================================

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

    return `${this.imageApi}${imageUrl}`;
  }


  // ========================================================
  // DISCOUNT
  // ========================================================

  hasDiscount(): boolean {

    return Number(
      this.product.discountPercentage ?? 0
    ) > 0;
  }


  getDiscountedPrice(): number {

    const price =
      Number(this.product.price ?? 0);

    const discount =
      Number(
        this.product.discountPercentage ?? 0
      );

    if (discount <= 0) {

      return price;
    }

    return Math.max(
      0,
      price -
      (price * discount / 100)
    );
  }


  // ========================================================
  // PRODUCT CLICK
  // ========================================================

  openDetails(): void {

    this.productClicked.emit(
      this.product
    );
  }


  // ========================================================
  // ADD TO CART
  // ========================================================

  addToCart(
    event: MouseEvent
  ): void {

    event.stopPropagation();

    if (!this.product.isInStock) {

      return;
    }

    this.addToCartClicked.emit(
      this.product
    );
  }

}