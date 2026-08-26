import {
  Component,
  OnInit,
  ChangeDetectorRef,
  HostListener,
  signal
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

import {
  ProductModalComponent
} from '../product-modal/product-modal.component';

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
  // SEARCH
  // ========================================================

  searchName = signal<string>('');


  // ========================================================
  // PRODUCTS
  // ========================================================

  products = signal<Product[]>([]);

  filteredProducts = signal<Product[]>([]);


  // ========================================================
  // QUANTITIES
  // ========================================================

  quantities = signal<Record<number, number>>({});


  // ========================================================
  // IMAGE API
  // ========================================================

  api = environment.imageApiBaseUrl;


  // ========================================================
  // CATEGORIES
  // ========================================================

  categories = signal<CategoryFilter[]>([]);

  subCategories = signal<SubCategoryFilter[]>([]);


  // ========================================================
  // BRANDS
  // ========================================================

  brands = signal<BrandFilter[]>([]);


  // ========================================================
  // SELECTED FILTERS
  // ========================================================

  selectedCategoryId = signal<number | null>(null);

  selectedSubCategoryId = signal<number | null>(null);

  selectedBrandId = signal<number | null>(null);


  // ========================================================
  // OFFERS
  // ========================================================

  showOffers = signal<boolean>(false);


  // ========================================================
  // LOADING
  // ========================================================

  isLoading = signal<boolean>(true);

  isLoadingCategories = signal<boolean>(true);

  isLoadingBrands = signal<boolean>(true);


  // ========================================================
  // DROPDOWN
  // ========================================================

  openDropdown:
    'category' |
    'subcategory' |
    'brand' |
    null = null;


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

      // CATEGORY

      this.selectedCategoryId.set(
        this.parseId(params['category'])
      );


      // SUBCATEGORY

      this.selectedSubCategoryId.set(
        this.parseId(params['subcategory'])
      );


      // BRAND

      this.selectedBrandId.set(
        this.parseId(params['brand'])
      );


      // OFFERS

      this.showOffers.set(
        params['offers'] === 'true'
      );


      // UPDATE SUBCATEGORIES

      this.updateSubCategories();


      // LOAD PRODUCTS FROM API

      this.loadProducts();

    });

  }


  // ========================================================
  // PARSE ID
  // ========================================================

  private parseId(value: unknown): number | null {

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
  // SEARCH
  // ========================================================

  onNameChange(): void {

    this.applyNameFilter();

  }


  // ========================================================
  // LOAD CATEGORIES
  // ========================================================

  private loadCategories(): void {

    this.isLoadingCategories.set(true);

    this.categoryService
      .getCategoriesMenu()
      .subscribe({

        next: (response: any) => {

          const data =
            response?.data ?? response ?? [];


          const mappedCategories: CategoryFilter[] =
            (data as any[]).map(
              (category: any) => {

                const subCategories =
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
                        subCategory.categoryId != null
                          ? Number(
                              subCategory.categoryId
                            )
                          : Number(
                              category.id
                            )

                    })
                  );


                return {

                  id: Number(
                    category.id
                  ),

                  name:
                    category.name,

                  subCategories

                };

              }
            );


          this.categories.set(
            mappedCategories
          );


          this.updateSubCategories();


          this.isLoadingCategories.set(
            false
          );


          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(
            'Error loading categories:',
            error
          );


          this.categories.set([]);

          this.subCategories.set([]);

          this.isLoadingCategories.set(
            false
          );


          this.cdr.detectChanges();

        }

      });

  }


  // ========================================================
  // LOAD BRANDS
  // ========================================================

  private loadBrands(): void {

    this.isLoadingBrands.set(true);

    this.brandService
      .getBrands()
      .subscribe({

        next: (response: any) => {

          const data =
            response?.data ?? response ?? [];


          const mappedBrands: BrandFilter[] =
            (data as any[]).map(
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


          this.brands.set(
            mappedBrands
          );


          this.isLoadingBrands.set(
            false
          );


          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(
            'Error loading brands:',
            error
          );


          this.brands.set([]);

          this.isLoadingBrands.set(
            false
          );


          this.cdr.detectChanges();

        }

      });

  }


  // ========================================================
  // LOAD PRODUCTS
  //
  // Category
  // Subcategory
  // Brand
  // Offers
  //
  // ALL COME FROM API.
  // ========================================================

  loadProducts(): void {

    this.isLoading.set(true);


    this.productService
      .getProducts(
        this.selectedCategoryId(),
        this.selectedSubCategoryId(),
        this.selectedBrandId(),
        this.showOffers()
      )
      .subscribe({

        next: (data: Product[]) => {

          const products =
            data ?? [];


          this.products.set(
            products
          );


          // Only product name is local.

          this.applyNameFilter();


          // Reset quantities.

          const quantityMap:
            Record<number, number> = {};


          products.forEach(product => {

            quantityMap[product.id] = 0;

          });


          this.quantities.set(
            quantityMap
          );


          this.isLoading.set(false);


          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(
            'Error loading products:',
            error
          );


          this.products.set([]);

          this.filteredProducts.set([]);

          this.quantities.set({});

          this.isLoading.set(false);


          this.cdr.detectChanges();

        }

      });

  }


  // ========================================================
  // UPDATE SUBCATEGORIES
  // ========================================================

  private updateSubCategories(): void {

    const categoryId =
      this.selectedCategoryId();

    const subCategoryId =
      this.selectedSubCategoryId();


    // ------------------------------------------------------
    // NO CATEGORY SELECTED
    // ------------------------------------------------------

    if (categoryId === null) {

      /*
       * A subcategory may have been selected directly
       * from another page/header.
       *
       * Find its parent category.
       */

      if (subCategoryId !== null) {

        for (
          const category of this.categories()
        ) {

          const found =
            category.subCategories.some(
              subCategory =>
                subCategory.id ===
                subCategoryId
            );


          if (found) {

            this.subCategories.set(
              category.subCategories
            );

            return;

          }

        }

      }


      this.subCategories.set([]);

      return;

    }


    // ------------------------------------------------------
    // CATEGORY SELECTED
    // ------------------------------------------------------

    const selectedCategory =
      this.categories().find(
        category =>
          category.id === categoryId
      );


    const availableSubCategories =
      selectedCategory?.subCategories ?? [];


    this.subCategories.set(
      availableSubCategories
    );


    // ------------------------------------------------------
    // CHECK SUBCATEGORY
    // ------------------------------------------------------

    if (
      subCategoryId !== null &&
      !availableSubCategories.some(
        subCategory =>
          subCategory.id ===
          subCategoryId
      )
    ) {

      this.selectedSubCategoryId.set(
        null
      );

    }

  }


  // ========================================================
  // DROPDOWN
  // ========================================================

  toggleDropdown(
    dropdown:
      'category' |
      'subcategory' |
      'brand'
  ): void {

    this.openDropdown =
      this.openDropdown === dropdown
        ? null
        : dropdown;

  }


  // ========================================================
  // OUTSIDE CLICK
  // ========================================================

  @HostListener(
    'document:click',
    ['$event']
  )
  closeDropdownOnOutsideClick(
    event: MouseEvent
  ): void {

    const target =
      event.target as HTMLElement;


    if (
      !target.closest('.custom-dropdown')
    ) {

      this.openDropdown = null;

    }

  }


  // ========================================================
  // SELECT CATEGORY
  // ========================================================

  selectCategoryFilter(
    id: number | null
  ): void {

    this.selectedCategoryId.set(id);

    this.selectedSubCategoryId.set(null);

    this.updateSubCategories();

    this.openDropdown = null;

    this.updateQueryParams();

  }


  // ========================================================
  // SELECT SUBCATEGORY
  // ========================================================

  selectSubCategoryFilter(
    id: number | null
  ): void {

    this.selectedSubCategoryId.set(id);

    this.openDropdown = null;

    this.updateQueryParams();

  }


  // ========================================================
  // SELECT BRAND
  // ========================================================

  selectBrandFilter(
    id: number | null
  ): void {

    this.selectedBrandId.set(id);

    this.openDropdown = null;

    this.updateQueryParams();

  }


  // ========================================================
  // CATEGORY CHANGE
  // ========================================================

  onCategoryChange(): void {

    this.selectedSubCategoryId.set(null);

    this.updateSubCategories();

    this.updateQueryParams();

  }


  // ========================================================
  // SUBCATEGORY CHANGE
  // ========================================================

  onSubCategoryChange(): void {

    this.updateQueryParams();

  }


  // ========================================================
  // BRAND CHANGE
  // ========================================================

  onBrandChange(): void {

    this.updateQueryParams();

  }


  // ========================================================
  // UPDATE QUERY PARAMS
  //
  // IMPORTANT:
  // Navigation triggers queryParams subscription.
  // That subscription calls loadProducts().
  //
  // Therefore we DON'T call loadProducts()
  // manually here.
  // ========================================================

  private updateQueryParams(): void {

    const queryParams: Record<string, string | null> = {};


    // CATEGORY

    const categoryId =
      this.selectedCategoryId();

    if (categoryId !== null) {

      queryParams['category'] =
        String(categoryId);

    }


    // SUBCATEGORY

    const subCategoryId =
      this.selectedSubCategoryId();

    if (subCategoryId !== null) {

      queryParams['subcategory'] =
        String(subCategoryId);

    }


    // BRAND

    const brandId =
      this.selectedBrandId();

    if (brandId !== null) {

      queryParams['brand'] =
        String(brandId);

    }


    // OFFERS

    if (this.showOffers()) {

      queryParams['offers'] = 'true';

    }


    // NAVIGATE

    this.router.navigate(
      ['/products'],
      {
        queryParams
      }
    );

  }


  // ========================================================
  // APPLY NAME FILTER
  // ========================================================

  private applyNameFilter(): void {

    const search =
      this.searchName()
        .trim()
        .toLowerCase();


    if (!search) {

      this.filteredProducts.set(
        this.products()
      );

      return;

    }


    const filtered =
      this.products().filter(
        product =>
          product.name
            ?.toLowerCase()
            .includes(search)
      );


    this.filteredProducts.set(
      filtered
    );

  }


  // ========================================================
  // CLEAR ALL FILTERS
  // ========================================================

  clearFilters(): void {

    this.searchName.set('');

    this.selectedCategoryId.set(null);

    this.selectedSubCategoryId.set(null);

    this.selectedBrandId.set(null);

    this.showOffers.set(false);

    this.subCategories.set([]);

    this.openDropdown = null;


    /*
     * Let queryParams subscription load
     * all products from API.
     */

    this.router.navigate(
      ['/products'],
      {
        queryParams: {}
      }
    );

  }


  // ========================================================
  // CLEAR CATEGORY
  // ========================================================

  clearCategory(): void {

    this.selectedCategoryId.set(null);

    this.selectedSubCategoryId.set(null);

    this.subCategories.set([]);

    this.updateQueryParams();

  }


  // ========================================================
  // CLEAR BRAND
  // ========================================================

  clearBrand(): void {

    this.selectedBrandId.set(null);

    this.updateQueryParams();

  }


  // ========================================================
  // CLEAR SUBCATEGORY
  // ========================================================

  clearSubCategory(): void {

    this.selectedSubCategoryId.set(null);

    this.updateQueryParams();

  }


  // ========================================================
  // CLEAR OFFERS
  // ========================================================

  clearOffers(): void {

    this.showOffers.set(false);

    this.updateQueryParams();

  }


  // ========================================================
  // TOGGLE OFFERS
  // ========================================================

  toggleOffers(): void {

    this.showOffers.set(
      !this.showOffers()
    );

    this.updateQueryParams();

  }


  // ========================================================
  // SELECTED CATEGORY NAME
  // ========================================================

  get selectedCategoryName(): string {

    const id =
      this.selectedCategoryId();


    if (id === null) {

      return '';

    }


    return this.categories().find(
      category =>
        category.id === id
    )?.name ?? '';

  }


  // ========================================================
  // SELECTED SUBCATEGORY NAME
  // ========================================================

  get selectedSubCategoryName(): string {

    const id =
      this.selectedSubCategoryId();


    if (id === null) {

      return '';

    }


    return this.subCategories().find(
      subCategory =>
        subCategory.id === id
    )?.name ?? '';

  }


  // ========================================================
  // SELECTED BRAND NAME
  // ========================================================

  get selectedBrandName(): string {

    const id =
      this.selectedBrandId();


    if (id === null) {

      return '';

    }


    return this.brands().find(
      brand =>
        brand.id === id
    )?.name ?? '';

  }


  // ========================================================
  // DISCOUNTED PRICE
  // ========================================================

  getDiscountedPrice(
    product: Product
  ): number {

    const price =
      Number(product.price || 0);

    const discount =
      Number(
        product.discountPercentage ?? 0
      );


    if (discount <= 0) {

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
  // QUANTITY
  //
  // IMPORTANT:
  // This replaces:
  //
  // quantities.update(q => ...)
  //
  // in HTML.
  // ========================================================

  setQuantity(
    productId: number,
    value: number | string
  ): void {

    let quantity =
      Number(value);


    if (
      Number.isNaN(quantity) ||
      quantity < 0
    ) {

      quantity = 0;

    }


    quantity =
      Math.floor(quantity);


    this.quantities.update(
      current => ({

        ...current,

        [productId]: quantity

      })
    );

  }


  // ========================================================
  // GET QUANTITY
  // ========================================================

  getQuantity(
    productId: number
  ): number {

    return this.quantities()[productId] ?? 0;

  }


  // ========================================================
  // ADD TO CART
  // ========================================================

  addToCart(
    product: Product,
    event: Event
  ): void {

    event.stopPropagation();


    if (!product.isInStock) {

      return;

    }


    const quantity =
      this.getQuantity(product.id);


    if (quantity <= 0) {

      return;

    }


    this.cartService.addToCart(
      product,
      quantity
    );

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