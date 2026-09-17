import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import { ProductService } from '../../../services/product.service';
import { Product } from '../../../models/product.model';
import { environment } from '../../../../environments/environment';
import { ProductCardComponent } from '../product-card.component/product-card.component';


@Component({
  selector: 'app-relative-products',
  standalone: true,

  imports: [
    CommonModule,
    TranslatePipe,
    ProductCardComponent
  ],

  templateUrl: './relative-products.html',
  styleUrl: './relative-products.scss'
})
export class RelativeProducts implements OnChanges {

  // =====================================================
  // SERVICES
  // =====================================================

  private readonly productService =
    inject(ProductService);


  // =====================================================
  // INPUTS
  // =====================================================


  @Input()
  currentProductId: number | null = null;

  @Input()
  subCategoryId: number | null = null;

  @Input()
  addedToCartProductId: number | null = null;

  @Input()
  alreadyInCartProductId: number | null = null;


  // =====================================================
  // OUTPUTS
  // =====================================================

  @Output()
  productClicked =
    new EventEmitter<Product>();

  @Output()
  addToCartClicked =
    new EventEmitter<Product>();


  // =====================================================
  // STATE
  // =====================================================

  readonly products =
    signal<Product[]>([]);

  readonly isLoading =
    signal(false);


  // =====================================================
  // IMAGE API
  // =====================================================

  readonly api =
    environment.imageApiBaseUrl;


  // =====================================================
  // INPUT CHANGES
  // =====================================================

  ngOnChanges(
    changes: SimpleChanges
  ): void {

    const subCategoryChanged =
      changes['subCategoryId'] &&
      changes['subCategoryId'].currentValue !==
      changes['subCategoryId'].previousValue;

    const productChanged =
      changes['currentProductId'] &&
      changes['currentProductId'].currentValue !==
      changes['currentProductId'].previousValue;

    if (
      subCategoryChanged ||
      productChanged
    ) {
      this.loadRelativeProducts();
    }
  }


  // =====================================================
  // LOAD RELATIVE PRODUCTS
  // =====================================================

  private loadRelativeProducts(): void {

    const subCategoryId =
      this.subCategoryId;
 const currentProductId =
      this.currentProductId;
  
    if (!subCategoryId) {

      this.products.set([]);

      return;
    }

    this.isLoading.set(true);

    this.productService
      .getProductsbySubID(subCategoryId,currentProductId)
      .subscribe({

        next: (products) => {
  const currentProductId =
            this.currentProductId;

          const relativeProducts =
            (products ?? []).filter(
              product =>
                product.id !== currentProductId
            );

          this.products.set(
            relativeProducts
          );

          this.isLoading.set(false);
        },

        error: (error) => {
 this.products.set([]);

          this.isLoading.set(false);
        }
      });
  }


  // =====================================================
  // TRACK PRODUCT
  // =====================================================

  trackByProductId(
    index: number,
    product: Product
  ): number {

    return product.id;
  }


  // =====================================================
  // PRODUCT CLICKED
  // =====================================================

  onProductClicked(
    product: Product
  ): void {

    this.productClicked.emit(product);
  }


  // =====================================================
  // ADD TO CART
  // =====================================================

  onAddToCartClicked(
    product: Product
  ): void {

    this.addToCartClicked.emit(product);
  }
}