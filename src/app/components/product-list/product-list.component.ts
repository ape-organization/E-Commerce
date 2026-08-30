import {
  Component,
  OnInit,
  ChangeDetectorRef,
  HostListener,
  signal,
  computed
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
import { TranslatePipe } from '@ngx-translate/core';


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
// PAGINATION RESPONSE
// ==========================================================

interface ProductPageResponse {
  items: Product[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}


// ==========================================================
// COMPONENT
// ==========================================================

@Component({
  selector: 'app-product-list',

  standalone: true,

  imports: [
    TranslatePipe,
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

  /*
   * Products currently shown on the screen.
   *
   * This can be:
   * - all currently loaded products
   * - locally filtered products
   * - products returned from a filtered API request
   */

  products = signal<Product[]>([]);

  filteredProducts = signal<Product[]>([]);


  // ========================================================
  // ALL UNFILTERED PRODUCTS LOADED SO FAR
  // ========================================================

  /*
   * This stores the unfiltered product pages.
   *
   * Example:
   *
   * Page 1 = 100
   * Page 2 = 100
   * Page 3 = 100
   *
   * allLoadedProducts = 300 products
   */

  allLoadedProducts =
    signal<Product[]>([]);

  unfilteredTotalCount =
    signal<number>(0);


  // ========================================================
  // PAGINATION
  // ========================================================

  private readonly PAGE_SIZE = 100;

  private currentPage = 0;

  hasMoreProducts =
    signal<boolean>(true);

  isLoadingMore =
    signal<boolean>(false);


  // ========================================================
  // QUANTITIES
  // ========================================================

  quantities =
    signal<Record<number, number>>({});


  // ========================================================
  // IMAGE API
  // ========================================================

  api =
    environment.imageApiBaseUrl;


  // ========================================================
  // CATEGORIES
  // ========================================================

  categories =
    signal<CategoryFilter[]>([]);

  subCategories =
    signal<SubCategoryFilter[]>([]);


  // ========================================================
  // BRANDS
  // ========================================================

  brands =
    signal<BrandFilter[]>([]);


  // ========================================================
  // SELECTED FILTERS
  // ========================================================

  selectedCategoryId =
    signal<number | null>(null);

  selectedSubCategoryId =
    signal<number | null>(null);

  selectedBrandId =
    signal<number | null>(null);


  // ========================================================
  // OFFERS
  // ========================================================

  showOffers =
    signal<boolean>(false);


  // ========================================================
  // API FILTER ACTIVE?
  // ========================================================

  /*
   * These are the filters handled by API/local product filtering:
   *
   * Category
   * Subcategory
   * Brand
   * Offers
   *
   * Product-name search is NOT included here.
   * Name search always stays local.
   */

  hasApiFilters =
    computed(() =>
      this.selectedCategoryId() !== null ||
      this.selectedSubCategoryId() !== null ||
      this.selectedBrandId() !== null ||
      this.showOffers()
    );


  // ========================================================
  // ALL UNFILTERED PRODUCTS LOADED?
  // ========================================================

  allUnfilteredProductsLoaded =
    computed(() => {

      const total =
        this.unfilteredTotalCount();

      const loaded =
        this.allLoadedProducts().length;

      if (total === 0) {
        return false;
      }

      return loaded >= total;
    });


  // ========================================================
  // LOADING
  // ========================================================

  isLoading =
    signal<boolean>(true);

  isLoadingCategories =
    signal<boolean>(true);

  isLoadingBrands =
    signal<boolean>(true);


  // ========================================================
  // DROPDOWN
  // ========================================================

  openDropdown:
    'category' |
    'subcategory' |
    'brand' |
    null = null;


  // ========================================================
  // REQUEST VERSION
  // ========================================================

  /*
   * Prevent an old request from overwriting a newer filter
   * request.
   *
   * Example:
   *
   * Brand A request starts
   * User immediately selects Brand B
   * Brand B request starts
   *
   * If Brand A finishes later, it will be ignored.
   */

  private requestVersion = 0;


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
      // CATEGORY
      // ====================================================

      this.selectedCategoryId.set(
        this.parseId(params['category'])
      );


      // ====================================================
      // SUBCATEGORY
      // ====================================================

      this.selectedSubCategoryId.set(
        this.parseId(params['subcategory'])
      );


      // ====================================================
      // BRAND
      // ====================================================

      this.selectedBrandId.set(
        this.parseId(params['brand'])
      );


      // ====================================================
      // OFFERS
      // ====================================================

      this.showOffers.set(
        params['offers'] === 'true'
      );


      // ====================================================
      // UPDATE SUBCATEGORIES
      // ====================================================

      this.updateSubCategories();


      // ====================================================
      // LOAD PRODUCTS
      // ====================================================

      this.loadProducts();

    });

  }


  // ========================================================
  // PARSE ID
  // ========================================================

  private parseId(
    value: unknown
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
            response?.data ??
            response ??
            [];


          const mappedCategories:
            CategoryFilter[] =
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
            response?.data ??
            response ??
            [];


          const mappedBrands:
            BrandFilter[] =
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
  // ========================================================

  /*
   * This is the main decision method.
   *
   * CASE 1:
   * Filter exists + all products already loaded
   * → filter locally.
   *
   * CASE 2:
   * Filter exists + not all products loaded
   * → call API and get ALL matching products.
   *
   * CASE 3:
   * No filter + products already loaded
   * → use the cached products.
   *
   * CASE 4:
   * First visit
   * → load first 100.
   */

  loadProducts(): void {

    const requestVersion =
      ++this.requestVersion;


    // ======================================================
    // CASE 1
    // FILTER ACTIVE + EVERYTHING ALREADY LOADED
    // ======================================================

    if (
      this.hasApiFilters() &&
      this.allUnfilteredProductsLoaded()
    ) {

      this.applyLocalApiFilters();

      this.isLoading.set(false);

      return;
    }


    // ======================================================
    // CASE 2
    // FILTER ACTIVE + NOT EVERYTHING LOADED
    // ======================================================

    if (this.hasApiFilters()) {

      this.loadFilteredProductsFromApi(
        requestVersion
      );

      return;
    }


    // ======================================================
    // CASE 3
    // NO FILTER + PRODUCTS ALREADY LOADED
    // ======================================================

    if (
      this.allLoadedProducts().length > 0
    ) {

      const cachedProducts =
        this.allLoadedProducts();


      this.products.set(
        cachedProducts
      );


      this.applyNameFilter();


      this.resetQuantities(
        cachedProducts
      );


      this.isLoading.set(false);

      return;
    }


    // ======================================================
    // CASE 4
    // FIRST LOAD
    // ======================================================

    this.loadFirstPage(
      requestVersion
    );

  }


  // ========================================================
  // LOAD FIRST PAGE
  // ========================================================

  private loadFirstPage(
    requestVersion: number
  ): void {

    this.isLoading.set(true);

    this.isLoadingMore.set(false);

    this.currentPage = 1;


    this.productService
      .getProducts(
        1,
        null,
        null,
        null,
        false
      )
      .subscribe({

        next: (
          response: ProductPageResponse
        ) => {

          // Ignore old request

          if (
            requestVersion !==
            this.requestVersion
          ) {
            return;
          }


          const loadedProducts =
            response.items ?? [];


          // =================================================
          // STORE UNFILTERED PRODUCTS
          // =================================================

          this.allLoadedProducts.set(
            loadedProducts
          );


          // =================================================
          // TOTAL COUNT
          // =================================================

          this.unfilteredTotalCount.set(
            response.totalCount ??
            loadedProducts.length
          );


          // =================================================
          // PAGINATION STATE
          // =================================================

          this.currentPage =
            response.page ?? 1;


          this.hasMoreProducts.set(
            response.hasMore === true
          );


          // =================================================
          // SHOW PRODUCTS
          // =================================================

          this.products.set(
            loadedProducts
          );


          // =================================================
          // NAME SEARCH
          // =================================================

          this.applyNameFilter();


          // =================================================
          // QUANTITIES
          // =================================================

          this.resetQuantities(
            loadedProducts
          );


          this.isLoading.set(false);

          this.cdr.detectChanges();

        },

        error: (error) => {

          if (
            requestVersion !==
            this.requestVersion
          ) {
            return;
          }


          console.error(
            'Error loading products:',
            error
          );


          this.products.set([]);

          this.filteredProducts.set([]);

          this.allLoadedProducts.set([]);

          this.unfilteredTotalCount.set(0);

          this.quantities.set({});

          this.hasMoreProducts.set(false);

          this.isLoading.set(false);

          this.isLoadingMore.set(false);


          this.cdr.detectChanges();

        }

      });

  }


  // ========================================================
  // LOAD NEXT PAGE
  // ========================================================

  /*
   * This is called by infinite scroll.
   *
   * Example:
   *
   * currentPage = 1
   * next page = 2
   *
   * currentPage = 2
   * next page = 3
   */

  private loadNextPage(): void {

    // Don't load another request while loading

    if (
      this.isLoading() ||
      this.isLoadingMore() ||
      !this.hasMoreProducts()
    ) {
      return;
    }


    // Infinite scroll only applies to
    // the unfiltered list.

    if (this.hasApiFilters()) {
      return;
    }


    const nextPage =
      this.currentPage + 1;


    this.isLoadingMore.set(true);


    this.productService
      .getProducts(
        nextPage,
        null,
        null,
        null,
        false
      )
      .subscribe({

        next: (
          response: ProductPageResponse
        ) => {

          const newProducts =
            response.items ?? [];


          // =================================================
          // EXISTING PRODUCTS
          // =================================================

          const existingProducts =
            this.allLoadedProducts();


          // =================================================
          // PREVENT DUPLICATES
          // =================================================

          const existingIds =
            new Set(
              existingProducts.map(
                product => product.id
              )
            );


          const uniqueProducts =
            newProducts.filter(
              product =>
                !existingIds.has(
                  product.id
                )
            );


          // =================================================
          // APPEND
          // =================================================

          if (
            uniqueProducts.length > 0
          ) {

            const updatedProducts = [
              ...existingProducts,
              ...uniqueProducts
            ];


            this.allLoadedProducts.set(
              updatedProducts
            );


            this.products.set(
              updatedProducts
            );


            // Apply local name search again

            this.applyNameFilter();


            // Add quantity entries for new products

            this.addQuantities(
              uniqueProducts
            );
          }


          // =================================================
          // UPDATE PAGINATION
          // =================================================

          this.currentPage =
            response.page ??
            nextPage;


          this.unfilteredTotalCount.set(
            response.totalCount ??
            this.unfilteredTotalCount()
          );


          this.hasMoreProducts.set(
            response.hasMore === true
          );


          this.isLoadingMore.set(false);

          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(
            'Error loading next product page:',
            error
          );


          this.isLoadingMore.set(false);

        }

      });

  }


  // ========================================================
  // LOAD FILTERED PRODUCTS FROM API
  // ========================================================

  /*
   * IMPORTANT:
   *
   * The backend must return ALL matching products when
   * category/subcategory/brand/offers is supplied.
   *
   * page is still sent as 1, but the backend does NOT
   * Take(100) for filtered requests.
   */

  private loadFilteredProductsFromApi(
    requestVersion: number
  ): void {

    this.isLoading.set(true);

    this.isLoadingMore.set(false);


    this.productService
      .getProducts(
        1,
        this.selectedCategoryId(),
        this.selectedSubCategoryId(),
        this.selectedBrandId(),
        this.showOffers()
      )
      .subscribe({

        next: (
          response: ProductPageResponse
        ) => {

          // Ignore old request

          if (
            requestVersion !==
            this.requestVersion
          ) {
            return;
          }


          const filtered =
            response.items ?? [];


          // =================================================
          // SHOW FILTERED RESULTS
          // =================================================

          this.products.set(
            filtered
          );


          // =================================================
          // NAME SEARCH
          // =================================================

          this.applyNameFilter();


          // =================================================
          // QUANTITIES
          // =================================================

          this.resetQuantities(
            filtered
          );


          this.isLoading.set(false);

          this.cdr.detectChanges();

        },

        error: (error) => {

          if (
            requestVersion !==
            this.requestVersion
          ) {
            return;
          }


          console.error(
            'Error loading filtered products:',
            error
          );


          this.products.set([]);

          this.filteredProducts.set([]);

          this.quantities.set({});

          this.isLoading.set(false);

          this.isLoadingMore.set(false);


          this.cdr.detectChanges();

        }

      });

  }


  // ========================================================
  // LOCAL API FILTER
  // ========================================================

  /*
   * Used only when ALL unfiltered products have already
   * been downloaded.
   *
   * This avoids unnecessary API requests.
   */

  private applyLocalApiFilters(): void {

    const categoryId =
      this.selectedCategoryId();

    const subCategoryId =
      this.selectedSubCategoryId();

    const brandId =
      this.selectedBrandId();

    const offers =
      this.showOffers();


    const filtered =
      this.allLoadedProducts().filter(
        product => {

          // ===============================================
          // CATEGORY
          // ===============================================

          if (
            categoryId !== null &&
            !product.subCategories?.some(
              subCategory =>
                subCategory.categoryId ===
                categoryId
            )
          ) {
            return false;
          }


          // ===============================================
          // SUBCATEGORY
          // ===============================================

          if (
            subCategoryId !== null &&
            !product.subCategories?.some(
              subCategory =>
                subCategory.id ===
                subCategoryId
            )
          ) {
            return false;
          }


          // ===============================================
          // BRAND
          // ===============================================

          if (
            brandId !== null &&
            product.brandId !== brandId
          ) {
            return false;
          }


          // ===============================================
          // OFFERS
          // ===============================================

          if (
            offers &&
            Number(
              product.discountPercentage ?? 0
            ) <= 0
          ) {
            return false;
          }


          return true;

        }
      );


    this.products.set(
      filtered
    );


    // Apply name search on top of the
    // category/brand/etc. filter

    this.applyNameFilter();


    this.resetQuantities(
      filtered
    );


    this.cdr.detectChanges();

  }


  // ========================================================
  // INFINITE SCROLL
  // ========================================================

  @HostListener(
    'window:scroll'
  )
  onWindowScroll(): void {

    // Don't paginate while a filter is active.

    if (this.hasApiFilters()) {
      return;
    }


    if (
      this.isLoading() ||
      this.isLoadingMore() ||
      !this.hasMoreProducts()
    ) {
      return;
    }


    const scrollPosition =
      window.innerHeight +
      window.scrollY;


    const pageHeight =
      document.documentElement.scrollHeight;


    /*
     * Start loading the next page when the user is
     * 500px away from the bottom.
     */

    if (
      scrollPosition >=
      pageHeight - 500
    ) {

      this.loadNextPage();

    }

  }


  // ========================================================
  // RESET QUANTITIES
  // ========================================================

  private resetQuantities(
    products: Product[]
  ): void {

    const quantityMap:
      Record<number, number> = {};


    products.forEach(product => {

      quantityMap[product.id] = 0;

    });


    this.quantities.set(
      quantityMap
    );

  }


  // ========================================================
  // ADD QUANTITIES
  // ========================================================

  private addQuantities(
    products: Product[]
  ): void {

    this.quantities.update(
      current => {

        const updated = {
          ...current
        };


        products.forEach(product => {

          if (
            updated[product.id] ===
            undefined
          ) {

            updated[product.id] = 0;

          }

        });


        return updated;

      }
    );

  }


  // ========================================================
  // UPDATE SUBCATEGORIES
  // ========================================================

  private updateSubCategories(): void {

    const categoryId =
      this.selectedCategoryId();

    const subCategoryId =
      this.selectedSubCategoryId();


    // ======================================================
    // NO CATEGORY SELECTED
    // ======================================================

    if (categoryId === null) {

      /*
       * A subcategory may have been selected directly
       * from the header or another page.
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


    // ======================================================
    // CATEGORY SELECTED
    // ======================================================

    const selectedCategory =
      this.categories().find(
        category =>
          category.id ===
          categoryId
      );


    const availableSubCategories =
      selectedCategory?.subCategories ??
      [];


    this.subCategories.set(
      availableSubCategories
    );


    // ======================================================
    // CHECK SUBCATEGORY
    // ======================================================

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
      this.openDropdown ===
      dropdown
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
      !target.closest(
        '.custom-dropdown'
      )
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
  // ========================================================

  private updateQueryParams(): void {

    const queryParams:
      Record<string, string | null> = {};


    // ======================================================
    // CATEGORY
    // ======================================================

    const categoryId =
      this.selectedCategoryId();


    if (categoryId !== null) {

      queryParams['category'] =
        String(categoryId);

    }


    // ======================================================
    // SUBCATEGORY
    // ======================================================

    const subCategoryId =
      this.selectedSubCategoryId();


    if (subCategoryId !== null) {

      queryParams['subcategory'] =
        String(subCategoryId);

    }


    // ======================================================
    // BRAND
    // ======================================================

    const brandId =
      this.selectedBrandId();


    if (brandId !== null) {

      queryParams['brand'] =
        String(brandId);

    }


    // ======================================================
    // OFFERS
    // ======================================================

    if (this.showOffers()) {

      queryParams['offers'] =
        'true';

    }


    // ======================================================
    // NAVIGATE
    // ======================================================

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

  /*
   * Name search always works locally.
   *
   * Important:
   *
   * If only 100 unfiltered products have been loaded,
   * name search searches those 100.
   *
   * Once all products are loaded, it searches everything.
   */

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
     * Do NOT clear allLoadedProducts here.
     *
     * If we already loaded 500 products, we can show those
     * immediately after clearing the filter.
     *
     * Infinite scroll will continue from page 5.
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
      Number(
        product.price || 0
      );


    const discount =
      Number(
        product.discountPercentage ??
        0
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
      product.discountPercentage ??
      0
    ) > 0;

  }


  // ========================================================
  // SET QUANTITY
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

        [productId]:
          quantity

      })
    );

  }


  // ========================================================
  // GET QUANTITY
  // ========================================================

  getQuantity(
    productId: number
  ): number {

    return (
      this.quantities()[productId] ??
      0
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


    if (!product.isInStock) {

      return;

    }


    const quantity =
      this.getQuantity(
        product.id
      );


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