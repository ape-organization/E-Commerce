import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  MatDialog,
  MatDialogModule
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { CategoryService } from '../../services/category.service';
import { BrandService } from '../../services/brand.service';

import { Product } from '../../models/product.model';

import { ProductModalComponent } from '../product-modal/product-modal.component';

import { environment } from '../../../environments/environment';

import { MaterialModule } from '../../shared/AngularMaterial';


// ==========================================================
// FILTER INTERFACES
// ==========================================================

interface SubCategoryFilter {
  id: number;
  name: string;
  categoryId?: number;
}

interface CategoryFilter {
  id: number;
  name: string;
  subCategories: SubCategoryFilter[];
}

interface BrandFilter {
  id: number;
  name: string;
  imageUrl?: string | null;
}


// ==========================================================
// COMPONENT
// ==========================================================

@Component({
  selector: 'app-product-list',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MaterialModule
  ],

  templateUrl: './product-list.component.html',

  styleUrls: [
    './product-list.component.css'
  ]
})
export class ProductListComponent implements OnInit {


  // ========================================================
  // PRODUCT NAME FILTER
  // ========================================================

  searchName = '';


  // ========================================================
  // PRODUCTS
  // ========================================================

  products: Product[] = [];

  filteredProducts: Product[] = [];


  // ========================================================
  // QUANTITIES
  // ========================================================

  quantities: Record<number, number> = {};


  // ========================================================
  // IMAGE API
  // ========================================================

  api = environment.imageApiBaseUrl;


  // ========================================================
  // CATEGORIES
  // ========================================================

  categories: CategoryFilter[] = [];

  subCategories: SubCategoryFilter[] = [];


  // ========================================================
  // BRANDS
  // ========================================================

  brands: BrandFilter[] = [];


  // ========================================================
  // SELECTED FILTERS
  // ========================================================

  selectedCategoryId: number | null = null;

  selectedSubCategoryId: number | null = null;

  selectedBrandId: number | null = null;


  // ========================================================
  // OFFERS
  // ========================================================

  showOffers = false;


  // ========================================================
  // LOADING
  // ========================================================

  isLoading = true;

  isLoadingCategories = true;

  isLoadingBrands = true;


  // ========================================================
  // CONSTRUCTOR
  // ========================================================

  constructor(
    private productService: ProductService,

    private cartService: CartService,

    private categoryService: CategoryService,

    private brandService: BrandService,

    private dialog: MatDialog,

    private cdr: ChangeDetectorRef,

    private route: ActivatedRoute,

    private router: Router
  ) {}


  // ========================================================
  // INIT
  // ========================================================

  ngOnInit(): void {

    /*
     * Load all products ONCE.
     *
     * IMPORTANT:
     * We do NOT send category,
     * subcategory, brand or offers
     * to the API.
     */
    this.loadProducts();


    /*
     * Load filter data.
     */
    this.loadCategories();

    this.loadBrands();


    /*
     * Read filters from URL.
     *
     * URL is only used to restore
     * the selected filter state.
     *
     * It does NOT trigger an API call.
     */
    this.route.queryParams.subscribe(params => {

     


      this.selectedCategoryId =
        this.parseId(
          params['category']
        );


      this.selectedSubCategoryId =
        this.parseId(
          params['subcategory']
        );


      this.selectedBrandId =
        this.parseId(
          params['brand']
        );


      this.showOffers =
        params['offers'] === 'true';


      this.updateSubCategories();


      /*
       * Apply the filters locally.
       *
       * No API call here.
       */
      this.applyFilters();

    });

  }


  // ========================================================
  // PARSE ID
  // ========================================================

  private parseId(
    value: any
  ): number | null {

    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {

      return null;

    }


    const id = Number(value);


    return Number.isNaN(id)
      ? null
      : id;

  }


  // ========================================================
  // PRODUCT NAME SEARCH
  // ========================================================

  onNameChange(): void {

    /*
     * LOCAL FILTER ONLY
     */
    this.applyFilters();

  }


  // ========================================================
  // LOAD CATEGORIES
  // ========================================================

  private loadCategories(): void {

    this.isLoadingCategories = true;

    this.categoryService
      .getCategoriesMenu()
      .subscribe({

        next: (response: any) => {

       


          const data =
            response?.data ?? response;


          this.categories =
            (data ?? []).map(
              (category: any) => ({

                id: Number(
                  category.id
                ),

                name:
                  category.name,

                subCategories:
                  (
                    category.subCategories ??
                    category.subcategories ??
                    []
                  ).map(
                    (subCategory: any) => ({

                      id: Number(
                        subCategory.id
                      ),

                      name:
                        subCategory.name,

                      categoryId:
                        Number(
                          subCategory.categoryId
                        )

                    })
                  )

              })
            );


          /*
           * Update available
           * subcategories.
           */
          this.updateSubCategories();


          /*
           * Re-apply local filters
           * after categories arrive.
           */
          this.applyFilters();


          this.isLoadingCategories =
            false;


          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(
            'Error loading categories:',
            error
          );


          this.categories = [];

          this.subCategories = [];


          this.isLoadingCategories =
            false;


          this.cdr.detectChanges();

        }

      });

  }


  // ========================================================
  // LOAD BRANDS
  // ========================================================

  private loadBrands(): void {

    this.isLoadingBrands = true;

    this.brandService
      .getBrands()
      .subscribe({

        next: (response: any) => {

       


          const data =
            response?.data ?? response;


          this.brands =
            (data ?? []).map(
              (brand: any) => ({

                id: Number(
                  brand.id
                ),

                name:
                  brand.name,

                imageUrl:
                  brand.imageUrl ?? null

              })
            );


       

          this.isLoadingBrands =
            false;


          this.applyFilters();


          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(
            'Error loading brands:',
            error
          );


          this.brands = [];


          this.isLoadingBrands =
            false;


          this.cdr.detectChanges();

        }

      });

  }


  // ========================================================
  // LOAD PRODUCTS
  // ========================================================

  loadProducts(): void {

    this.isLoading = true;


    /*
     * IMPORTANT:
     *
     * NO FILTER PARAMETERS HERE.
     *
     * We get ALL products from the API.
     */
    this.productService
      .getProducts()
      .subscribe({

        next: (data) => {

          /*
           * Store ALL products.
           */
          this.products = data;


          /*
           * Apply all filters locally.
           */
          this.applyFilters();


          /*
           * Initialize quantities.
           */
          this.quantities = {};


          this.products.forEach(
            product => {

              this.quantities[
                product.id
              ] = 0;

            }
          );


          this.isLoading = false;


          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(
            'Error loading products:',
            error
          );


          this.products = [];

          this.filteredProducts = [];


          this.isLoading = false;


          this.cdr.detectChanges();

        }

      });

  }


  // ========================================================
  // UPDATE SUBCATEGORIES
  // ========================================================

  private updateSubCategories(): void {

    /*
     * No category selected.
     */
    if (
      this.selectedCategoryId === null
    ) {

      /*
       * If a subcategory was selected
       * directly, find its category.
       */
      if (
        this.selectedSubCategoryId !== null
      ) {

        for (
          const category of this.categories
        ) {

          const found =
            category.subCategories.find(
              subCategory =>
                subCategory.id ===
                this.selectedSubCategoryId
            );


          if (found) {

            this.subCategories =
              category.subCategories;

            return;

          }

        }

      }


      this.subCategories = [];

      return;

    }


    /*
     * Find selected category.
     */
    const selectedCategory =
      this.categories.find(
        category =>
          category.id ===
          this.selectedCategoryId
      );


    /*
     * Get its subcategories.
     */
    this.subCategories =
      selectedCategory?.subCategories ?? [];


    /*
     * Make sure selected
     * subcategory belongs to
     * selected category.
     */
    if (
      this.selectedSubCategoryId !== null &&
      !this.subCategories.some(
        subCategory =>
          subCategory.id ===
          this.selectedSubCategoryId
      )
    ) {

      this.selectedSubCategoryId = null;

    }

  }


  // ========================================================
  // CATEGORY CHANGE
  // ========================================================

  onCategoryChange(): void {

    /*
     * Changing category resets
     * subcategory.
     */
    this.selectedSubCategoryId = null;


    /*
     * Update subcategory dropdown.
     */
    this.updateSubCategories();


    /*
     * APPLY LOCALLY.
     *
     * NO API CALL.
     */
    this.applyFilters();


    /*
     * Update URL only.
     */
    this.updateQueryParams();

  }


  // ========================================================
  // SUBCATEGORY CHANGE
  // ========================================================

  onSubCategoryChange(): void {

    /*
     * LOCAL FILTER.
     */
    this.applyFilters();


    /*
     * URL only.
     */
    this.updateQueryParams();

  }


  // ========================================================
  // BRAND CHANGE
  // ========================================================

  onBrandChange(): void {

    /*
     * LOCAL FILTER.
     */
    this.applyFilters();


    /*
     * URL only.
     */
    this.updateQueryParams();

  }


  // ========================================================
  // UPDATE QUERY PARAMS
  // ========================================================

  private updateQueryParams(): void {

    const queryParams: any = {};


    if (
      this.selectedCategoryId !== null
    ) {

      queryParams.category =
        this.selectedCategoryId;

    }


    if (
      this.selectedSubCategoryId !== null
    ) {

      queryParams.subcategory =
        this.selectedSubCategoryId;

    }


    if (
      this.selectedBrandId !== null
    ) {

      queryParams.brand =
        this.selectedBrandId;

    }


    if (this.showOffers) {

      queryParams.offers =
        'true';

    }


    /*
     * IMPORTANT:
     *
     * This ONLY changes the URL.
     *
     * It does NOT reload products.
     */
    this.router.navigate(
      ['/products'],
      {
        queryParams
      }
    );

  }


  // ========================================================
  // APPLY FILTERS
  // ========================================================

  private applyFilters(): void {

    if (!this.products) {

      return;

    }


    const search =
      this.searchName
        .trim()
        .toLowerCase();


    this.filteredProducts =
      this.products.filter(
        product => {


          // ================================================
          // NAME
          // ================================================

          const nameMatch =
            !search ||
            product.name
              ?.toLowerCase()
              .includes(search);


          // ================================================
          // CATEGORY
          // ================================================

          const categoryMatch =
            this.selectedCategoryId === null ||
            product.subCategories?.some(
              subCategory =>
                Number(
                  subCategory.categoryId
                ) ===
                this.selectedCategoryId
            );


          // ================================================
          // SUBCATEGORY
          // ================================================

          const subCategoryMatch =
            this.selectedSubCategoryId === null ||
            product.subCategories?.some(
              subCategory =>
                Number(
                  subCategory.id
                ) ===
                this.selectedSubCategoryId
            );


          // ================================================
          // BRAND
          // ================================================

          const brandMatch =
            this.selectedBrandId === null ||
            Number(
              product.brandId
            ) ===
            this.selectedBrandId;


          // ================================================
          // OFFERS
          // ================================================

          const offerMatch =
            !this.showOffers ||
            Number(
              product.discountPercentage ?? 0
            ) > 0;


          // ================================================
          // FINAL RESULT
          // ================================================

          return (
            nameMatch &&
            categoryMatch &&
            subCategoryMatch &&
            brandMatch &&
            offerMatch
          );

        }
      );


    this.cdr.detectChanges();

  }


  // ========================================================
  // CLEAR FILTERS
  // ========================================================

  clearFilters(): void {

    this.searchName = '';

    this.selectedCategoryId = null;

    this.selectedSubCategoryId = null;

    this.selectedBrandId = null;

    this.showOffers = false;

    this.subCategories = [];


    /*
     * Clear URL.
     */
    this.router.navigate(
      ['/products']
    );


    /*
     * Show all products locally.
     */
    this.applyFilters();

  }


  // ========================================================
  // CLEAR CATEGORY ONLY
  // ========================================================

  clearCategory(): void {

    this.selectedCategoryId = null;

    this.selectedSubCategoryId = null;

    this.subCategories = [];


    /*
     * LOCAL FILTER.
     */
    this.applyFilters();


    /*
     * URL ONLY.
     */
    this.updateQueryParams();

  }


  // ========================================================
  // CLEAR BRAND ONLY
  // ========================================================

  clearBrand(): void {

    this.selectedBrandId = null;


    /*
     * LOCAL FILTER.
     */
    this.applyFilters();


    /*
     * URL ONLY.
     */
    this.updateQueryParams();

  }


  // ========================================================
  // CLEAR SUBCATEGORY
  // ========================================================

  clearSubCategory(): void {

    this.selectedSubCategoryId = null;


    /*
     * LOCAL FILTER.
     */
    this.applyFilters();


    /*
     * URL ONLY.
     */
    this.updateQueryParams();

  }


  // ========================================================
  // TURN OFF OFFERS
  // ========================================================

  clearOffers(): void {

    this.showOffers = false;


    /*
     * LOCAL FILTER.
     */
    this.applyFilters();


    /*
     * URL ONLY.
     */
    this.updateQueryParams();

  }


  // ========================================================
  // TOGGLE OFFERS
  // ========================================================

  toggleOffers(): void {

    this.showOffers =
      !this.showOffers;


    /*
     * LOCAL FILTER.
     */
    this.applyFilters();


    /*
     * URL ONLY.
     */
    this.updateQueryParams();

  }


  // ========================================================
  // SELECTED CATEGORY NAME
  // ========================================================

  get selectedCategoryName(): string {

    if (
      this.selectedCategoryId === null
    ) {

      return '';

    }


    return this.categories.find(
      category =>
        category.id ===
        this.selectedCategoryId
    )?.name ?? '';

  }


  // ========================================================
  // SELECTED SUBCATEGORY NAME
  // ========================================================

  get selectedSubCategoryName(): string {

    if (
      this.selectedSubCategoryId === null
    ) {

      return '';

    }


    return this.subCategories.find(
      subCategory =>
        subCategory.id ===
        this.selectedSubCategoryId
    )?.name ?? '';

  }


  // ========================================================
  // SELECTED BRAND NAME
  // ========================================================

  get selectedBrandName(): string {

    if (
      this.selectedBrandId === null
    ) {

      return '';

    }


    return this.brands.find(
      brand =>
        brand.id ===
        this.selectedBrandId
    )?.name ?? '';

  }


  // ========================================================
  // DISCOUNTED PRICE
  // ========================================================

  getDiscountedPrice(
    product: Product
  ): number {

    const discount =
      Number(
        product.discountPercentage ?? 0
      );


    if (
      discount <= 0
    ) {

      return product.price;

    }


    const discountedPrice =
      product.price -
      (
        product.price *
        discount /
        100
      );


    return Math.max(
      0,
      discountedPrice
    );

  }


  // ========================================================
  // HAS DISCOUNT
  // ========================================================

  hasDiscount(
    product: Product
  ): boolean {

    return Number(
      product.discountPercentage ?? 0
    ) > 0;

  }


  // ========================================================
  // PRODUCT DETAILS
  // ========================================================

  openProductDetails(
    product: Product
  ): void {

    this.dialog.open(
      ProductModalComponent,
      {

        width: '800px',

        maxWidth: '95vw',

        data: product,

        disableClose: false

      }
    );

  }


  // ========================================================
  // ADD TO CART
  // ========================================================

 addToCart(
  product: Product,
  event: Event
): void {

  event.stopPropagation();


  // ========================================================
  // OUT OF STOCK
  // ========================================================

  if (!product.isInStock) {

    return;

  }


  // ========================================================
  // QUANTITY
  // ========================================================

  const quantity =
    this.quantities[product.id] || 0;


  if (quantity <= 0) {

    return;

  }


  // ========================================================
  // ADD TO CART
  // ========================================================

  this.cartService.addToCart(
    product,
    quantity
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

    return `${this.api}${imageUrl}`;

  }

}