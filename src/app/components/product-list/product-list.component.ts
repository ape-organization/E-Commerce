import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  MatDialog,
  MatDialogModule
} from '@angular/material/dialog';

import {
  MatButtonModule
} from '@angular/material/button';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  ProductService
} from '../../services/product.service';

import {
  CartService
} from '../../services/cart.service';

import {
  CategoryService
} from '../../services/category.service';

import {
  BrandService
} from '../../services/brand.service';

import {
  Product
} from '../../models/product.model';

import {
  ProductModalComponent
} from '../product-modal/product-modal.component';

import {
  environment
} from '../../../environments/environment';

import {
  MaterialModule
} from '../../shared/AngularMaterial';


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

  this.loadCategories();

  this.loadBrands();


  this.route.queryParams.subscribe(params => {

    // ====================================================
    // READ CATEGORY
    // ====================================================

    this.selectedCategoryId =
      this.parseId(params['category']);


    // ====================================================
    // READ SUBCATEGORY
    // ====================================================

    this.selectedSubCategoryId =
      this.parseId(params['subcategory']);

    // ====================================================
    // READ BRAND
    // ====================================================

    this.selectedBrandId =
      this.parseId(params['brand']);


    // ====================================================
    // READ OFFERS
    // ====================================================

    this.showOffers =
      params['offers'] === 'true';


    // ====================================================
    // UPDATE SUBCATEGORIES
    // ====================================================

    this.updateSubCategories();


    // ====================================================
    // LOAD FROM API
    // ====================================================

    this.loadProducts();

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
     * Name search is still local.
     *
     * Category / SubCategory / Brand / Offers
     * are already filtered by the API.
     */

    this.applyNameFilter();

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


          this.updateSubCategories();


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

  this.productService
    .getProducts(
      this.selectedCategoryId,
      this.selectedSubCategoryId,
      this.selectedBrandId,
      this.showOffers
    )
    .subscribe({

      next: (data) => {

        this.products = data ?? [];


        // Name search is the ONLY local filter.
        this.applyNameFilter();


        // Reset quantities
        this.quantities = {};

        this.products.forEach(product => {

          this.quantities[product.id] = 0;

        });


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

  // Category changed, so reset subcategory
  this.selectedSubCategoryId = null;

  // Update available subcategories
  this.updateSubCategories();

  // ONLY update URL.
  // queryParams subscription will call loadProducts().
  this.updateQueryParams();
}


  // ========================================================
  // SUBCATEGORY CHANGE
  // ========================================================

 onSubCategoryChange(): void {

  // ONLY update URL.
  this.updateQueryParams();
}

  // ========================================================
  // BRAND CHANGE
  // ========================================================

onBrandChange(): void {

  // ONLY update URL.
  this.updateQueryParams();
}


  // ========================================================
  // UPDATE QUERY PARAMS
  // ========================================================

 private updateQueryParams(): void {

  const queryParams: any = {};

  // ------------------------------------------------------
  // CATEGORY
  // ------------------------------------------------------

  if (this.selectedCategoryId !== null) {

    queryParams.category =
      this.selectedCategoryId;

  }


  // ------------------------------------------------------
  // SUBCATEGORY
  // ------------------------------------------------------

  if (this.selectedSubCategoryId !== null) {

    queryParams.subcategory =
      this.selectedSubCategoryId;

  }


  // ------------------------------------------------------
  // BRAND
  // ------------------------------------------------------

  if (this.selectedBrandId !== null) {

    queryParams.brand =
      this.selectedBrandId;

  }


  // ------------------------------------------------------
  // OFFERS
  // ------------------------------------------------------

  /*
   * IMPORTANT:
   *
   * When offers is false, DON'T put:
   *
   * offers=false
   *
   * in the URL.
   *
   * We remove the parameter completely.
   *
   * Therefore:
   *
   * offers=true
   *       ↓
   * GET /api/products?offers=true
   *
   * remove offers
   *       ↓
   * GET /api/products
   *
   * or with another filter:
   *
   * GET /api/products?categoryId=5
   */

  if (this.showOffers) {

    queryParams.offers = 'true';

  }


  // ------------------------------------------------------
  // NAVIGATE
  // ------------------------------------------------------

  this.router.navigate(
    ['/products'],
    {
      queryParams
    }
  );

}


  // ========================================================
  // NAME FILTER ONLY
  // ========================================================

  private applyNameFilter(): void {

    const search =
      this.searchName
        .trim()
        .toLowerCase();


    /*
     * API has already filtered:
     *
     * category
     * subcategory
     * brand
     * offers
     *
     * We ONLY filter name here.
     */

    if (!search) {

      this.filteredProducts =
        [...this.products];

      return;

    }


    this.filteredProducts =
      this.products.filter(
        product =>

          product.name
            ?.toLowerCase()
            .includes(search)

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
      ['/products'],
      {
        queryParams: {}
      }
    );


    /*
     * Load ALL products from API.
     */

    this.loadProducts();

  }


  // ========================================================
  // CLEAR CATEGORY ONLY
  // ========================================================

  clearCategory(): void {

    this.selectedCategoryId = null;

    this.selectedSubCategoryId = null;

    this.subCategories = [];


    this.updateQueryParams();

    this.loadProducts();

  }


  // ========================================================
  // CLEAR BRAND ONLY
  // ========================================================

  clearBrand(): void {

    this.selectedBrandId = null;


    this.updateQueryParams();

    this.loadProducts();

  }


  // ========================================================
  // CLEAR SUBCATEGORY
  // ========================================================

  clearSubCategory(): void {

    this.selectedSubCategoryId = null;


    this.updateQueryParams();

    this.loadProducts();

  }


  // ========================================================
  // TURN OFF OFFERS
  // ========================================================

  clearOffers(): void {

    this.showOffers = false;


    this.updateQueryParams();

    this.loadProducts();

  }


  // ========================================================
  // TOGGLE OFFERS
  // ========================================================

 toggleOffers(): void {

  this.showOffers = !this.showOffers;

  // ONLY update URL.
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


    // =====================================================
    // OUT OF STOCK
    // =====================================================

    if (!product.isInStock) {

      return;

    }


    // =====================================================
    // QUANTITY
    // =====================================================

    const quantity =
      this.quantities[product.id] || 0;


    if (quantity <= 0) {

      return;

    }


    // =====================================================
    // ADD TO CART
    // =====================================================

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