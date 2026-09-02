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

import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { CategoryService } from '../../../services/category.service';
import { BrandService } from '../../../services/brand.service';
import { LanguageService } from '../../../services/language.service';

import {
  Product,
  ProductFilterValue
} from '../../../models/product.model';

import { ProductModalComponent } from '../../shared/product-modal/product-modal.component';

import { environment } from '../../../../environments/environment';

import { MaterialModule } from '../../../shared/AngularMaterial';

import { TranslatePipe } from '@ngx-translate/core';

import {
  ProductCardComponent
} from '../product-card.component/product-card.component';

import {
  ProductFiltersComponent
} from '../product-filters.component/product-filters.component';

import { CategoryFilter } from '../../../models/category.model';
import { SubCategoryFilter } from '../../../models/subCategory.model';
import { BrandFilter } from '../../../models/brand.model';
import { ProductPageResponse } from '../../../models/pagination.model';


@Component({
  selector: 'app-product-list',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MaterialModule,
    TranslatePipe,
    ProductCardComponent,
    ProductFiltersComponent
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

  allLoadedProducts = signal<Product[]>([]);

  unfilteredTotalCount = signal<number>(0);


  // ========================================================
  // PAGINATION
  // ========================================================

  private readonly PAGE_SIZE = 100;

  private currentPage = 0;

  hasMoreProducts = signal<boolean>(true);

  isLoadingMore = signal<boolean>(false);


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
  // API FILTERS ACTIVE
  // ========================================================

  hasApiFilters = computed(() =>
    this.selectedCategoryId() !== null ||
    this.selectedSubCategoryId() !== null ||
    this.selectedBrandId() !== null ||
    this.showOffers()
  );


  // ========================================================
  // ALL UNFILTERED PRODUCTS LOADED
  // ========================================================

  allUnfilteredProductsLoaded = computed(() => {

    const total =
      this.unfilteredTotalCount();

    const loaded =
      this.allLoadedProducts().length;

    if (total <= 0) {
      return false;
    }

    return loaded >= total;

  });


  // ========================================================
  // ACTIVE FILTER COUNT
  // ========================================================

  activeFilterCount = computed(() => {

    let count = 0;

    if (
      this.searchName()
        .trim()
    ) {
      count++;
    }

    if (
      this.selectedCategoryId() !== null
    ) {
      count++;
    }

    if (
      this.selectedSubCategoryId() !== null
    ) {
      count++;
    }

    if (
      this.selectedBrandId() !== null
    ) {
      count++;
    }

    if (
      this.showOffers()
    ) {
      count++;
    }

    return count;

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
  // REQUEST VERSION
  // ========================================================

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
    private router: Router,
    public languageService: LanguageService
  ) {}


  // ========================================================
  // INIT
  // ========================================================

  ngOnInit(): void {

    this.loadCategories();

    this.loadBrands();

    this.route.queryParams
      .subscribe(params => {

        this.selectedCategoryId.set(
          this.parseId(
            params['category']
          )
        );

        this.selectedSubCategoryId.set(
          this.parseId(
            params['subcategory']
          )
        );

        this.selectedBrandId.set(
          this.parseId(
            params['brand']
          )
        );

        this.showOffers.set(
          params['offers'] === 'true'
        );

        this.updateSubCategories();

        this.loadProducts();

      });

  }


  // ========================================================
  // LANGUAGE
  // ========================================================

  getProductName(
    product: Product
  ): string {

    if (
      this.languageService.isArabic()
    ) {

      return (
        product.nameAr?.trim() ||
        product.nameEn ||
        'Product'
      );

    }

    return (
      product.nameEn?.trim() ||
      product.nameAr ||
      'Product'
    );

  }


  getCategoryName(
    category: CategoryFilter
  ): string {

    if (
      this.languageService.isArabic()
    ) {

      return (
        category.nameAr?.trim() ||
        category.nameEn ||
        ''
      );

    }

    return (
      category.nameEn?.trim() ||
      category.nameAr ||
      ''
    );

  }


  getSubCategoryName(
    subCategory: SubCategoryFilter
  ): string {

    if (
      this.languageService.isArabic()
    ) {

      return (
        subCategory.nameAr?.trim() ||
        subCategory.nameEn ||
        ''
      );

    }

    return (
      subCategory.nameEn?.trim() ||
      subCategory.nameAr ||
      ''
    );

  }


  getBrandName(
    brand: BrandFilter
  ): string {

    if (
      this.languageService.isArabic()
    ) {

      return (
        brand.nameAr?.trim() ||
        brand.nameEn ||
        ''
      );

    }

    return (
      brand.nameEn?.trim() ||
      brand.nameAr ||
      ''
    );

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

    const id =
      Number(value);

    return Number.isNaN(id)
      ? null
      : id;

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
            (data as any[])
              .map(
                (category: any) => {

                  const subCategories:
                    SubCategoryFilter[] =
                    (
                      category.subCategories ??
                      category.subcategories ??
                      []
                    )
                    .map(
                      (subCategory: any) => ({

                        id:
                          Number(
                            subCategory.id
                          ),

                        nameEn:
                          subCategory.nameEn ??
                          '',

                        nameAr:
                          subCategory.nameAr ??
                          '',

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

                    id:
                      Number(
                        category.id
                      ),

                    nameEn:
                      category.nameEn ??
                      '',

                    nameAr:
                      category.nameAr ??
                      '',

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

        error: error => {

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
            (data as any[])
              .map(
                (brand: any) => ({

                  id:
                    Number(
                      brand.id
                    ),

                  nameEn:
                    brand.nameEn ??
                    '',

                  nameAr:
                    brand.nameAr ??
                    '',

                  imageUrl:
                    brand.imageUrl ??
                    null

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

        error: error => {

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

  loadProducts(): void {

    const requestVersion =
      ++this.requestVersion;


    // ======================================================
    // API FILTERS + ALL PRODUCTS ALREADY LOADED
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
    // API FILTERS + NOT ALL PRODUCTS LOADED
    // ======================================================

    if (
      this.hasApiFilters()
    ) {

      this.loadFilteredProductsFromApi(
        requestVersion
      );

      return;

    }


    // ======================================================
    // NO API FILTERS + CACHE EXISTS
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

          if (
            requestVersion !==
            this.requestVersion
          ) {
            return;
          }

          const loadedProducts =
            response.items ?? [];

          this.allLoadedProducts.set(
            loadedProducts
          );

          this.unfilteredTotalCount.set(
            response.totalCount ??
            loadedProducts.length
          );

          this.currentPage =
            response.page ?? 1;

          this.hasMoreProducts.set(
            response.hasMore === true
          );

          this.products.set(
            loadedProducts
          );

          this.applyNameFilter();

          this.resetQuantities(
            loadedProducts
          );

          this.isLoading.set(false);

          this.cdr.detectChanges();

        },

        error: error => {

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

  private loadNextPage(): void {

    if (
      this.isLoading() ||
      this.isLoadingMore() ||
      !this.hasMoreProducts()
    ) {

      return;

    }


    /*
     * Infinite scroll is only used for the
     * unfiltered collection.
     */

    if (
      this.hasApiFilters()
    ) {

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

          const existingProducts =
            this.allLoadedProducts();

          const existingIds =
            new Set(
              existingProducts.map(
                product =>
                  product.id
              )
            );

          const uniqueProducts =
            newProducts.filter(
              product =>
                !existingIds.has(
                  product.id
                )
            );

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

            this.applyNameFilter();

            this.addQuantities(
              uniqueProducts
            );

          }

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

        error: error => {

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

          if (
            requestVersion !==
            this.requestVersion
          ) {

            return;

          }

          const filtered =
            response.items ?? [];

          this.products.set(
            filtered
          );

          this.applyNameFilter();

          this.resetQuantities(
            filtered
          );

          this.isLoading.set(false);

          this.cdr.detectChanges();

        },

        error: error => {

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
  // APPLY API FILTERS LOCALLY
  // ========================================================

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
      this.allLoadedProducts()
        .filter(
          product => {

            // CATEGORY
            if (
              categoryId !== null &&
              !product.subCategories?.some(
                subCategory =>
                  Number(
                    subCategory.categoryId
                  ) === categoryId
              )
            ) {

              return false;

            }


            // SUBCATEGORY
            if (
              subCategoryId !== null &&
              !product.subCategories?.some(
                subCategory =>
                  Number(
                    subCategory.id
                  ) === subCategoryId
              )
            ) {

              return false;

            }


            // BRAND
            if (
              brandId !== null &&
              Number(
                product.brandId
              ) !== brandId
            ) {

              return false;

            }


            // OFFERS
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

    this.applyNameFilter();

    this.resetQuantities(
      filtered
    );

    this.isLoading.set(false);

    this.cdr.detectChanges();

  }


  // ========================================================
  // FILTER APPLIED
  // ========================================================

  onFilterApplied(
    filters: ProductFilterValue
  ): void {

    this.searchName.set(
      filters.searchName.trim()
    );

    this.selectedCategoryId.set(
      filters.categoryId
    );

    this.selectedSubCategoryId.set(
      filters.subCategoryId
    );

    this.selectedBrandId.set(
      filters.brandId
    );

    this.showOffers.set(
      filters.offers
    );

    this.updateSubCategories();

    this.navigateWithCurrentFilters();

  }


  // ========================================================
  // MOBILE FILTER DIALOG
  // ========================================================

  openMobileFilters(): void {

    const dialogRef =
      this.dialog.open(
        ProductFiltersComponent,
        {
          width: '95vw',
          maxWidth: '500px',
          maxHeight: '90vh',
          autoFocus: false,
          panelClass:
            'product-filter-dialog'
        }
      );

    const component =
      dialogRef.componentInstance;


    component.categories =
      this.categories();

    component.subCategories =
      this.subCategories();

    component.brands =
      this.brands();

    component.searchName =
      this.searchName();

    component.selectedCategoryId =
      this.selectedCategoryId();

    component.selectedSubCategoryId =
      this.selectedSubCategoryId();

    component.selectedBrandId =
      this.selectedBrandId();

    component.showOffers =
      this.showOffers();


    component.syncInputs();


    const filterSubscription =
      component.filterApplied
        .subscribe(filters => {

          this.onFilterApplied(
            filters
          );

          dialogRef.close();

        });


    const clearSubscription =
      component.clearFiltersEvent
        .subscribe(() => {

          this.clearFilters();

          dialogRef.close();

        });


    dialogRef.afterClosed()
      .subscribe(() => {

        filterSubscription.unsubscribe();

        clearSubscription.unsubscribe();

      });

  }


  // ========================================================
  // CLEAR SEARCH
  // ========================================================

  clearSearch(): void {

    this.searchName.set('');

    this.applyNameFilter();

  }


  // ========================================================
  // CLEAR CATEGORY
  // ========================================================

  clearCategory(): void {

    this.selectedCategoryId.set(null);

    this.selectedSubCategoryId.set(null);

    this.updateSubCategories();

    this.navigateWithCurrentFilters();

  }


  // ========================================================
  // CLEAR SUBCATEGORY
  // ========================================================

  clearSubCategory(): void {

    this.selectedSubCategoryId.set(null);

    this.updateSubCategories();

    this.navigateWithCurrentFilters();

  }


  // ========================================================
  // CLEAR BRAND
  // ========================================================

  clearBrand(): void {

    this.selectedBrandId.set(null);

    this.navigateWithCurrentFilters();

  }


  // ========================================================
  // CLEAR OFFERS
  // ========================================================

  clearOffers(): void {

    this.showOffers.set(false);

    this.navigateWithCurrentFilters();

  }


  // ========================================================
  // INFINITE SCROLL
  // ========================================================

  @HostListener('window:scroll')
  onWindowScroll(): void {

    if (
      this.hasApiFilters()
    ) {

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

    if (
      scrollPosition >=
      pageHeight - 500
    ) {

      this.loadNextPage();

    }

  }


  // ========================================================
  // QUANTITIES
  // ========================================================

  private resetQuantities(
    products: Product[]
  ): void {

    const quantityMap:
      Record<number, number> = {};

    products.forEach(product => {

      quantityMap[
        product.id
      ] = 0;

    });

    this.quantities.set(
      quantityMap
    );

  }


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
            updated[
              product.id
            ] === undefined
          ) {

            updated[
              product.id
            ] = 0;

          }

        });

        return updated;

      }
    );

  }


  // ========================================================
  // SUBCATEGORIES
  // ========================================================

  private updateSubCategories(): void {

    const categoryId =
      this.selectedCategoryId();

    const subCategoryId =
      this.selectedSubCategoryId();


    // ------------------------------------------------------
    // NO CATEGORY
    // ------------------------------------------------------

    if (
      categoryId === null
    ) {

      if (
        subCategoryId !== null
      ) {

        for (
          const category of
          this.categories()
        ) {

          const found =
            category.subCategories.some(
              subCategory =>
                Number(
                  subCategory.id
                ) === subCategoryId
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
          Number(
            category.id
          ) === categoryId
      );

    const availableSubCategories =
      selectedCategory?.subCategories ??
      [];

    this.subCategories.set(
      availableSubCategories
    );


    // ------------------------------------------------------
    // INVALID SUBCATEGORY
    // ------------------------------------------------------

    if (
      subCategoryId !== null &&
      !availableSubCategories.some(
        subCategory =>
          Number(
            subCategory.id
          ) === subCategoryId
      )
    ) {

      this.selectedSubCategoryId.set(
        null
      );

    }

  }


  // ========================================================
  // NAVIGATION
  // ========================================================

  private navigateWithCurrentFilters(): void {

    const queryParams:
      Record<string, string> = {};


    const categoryId =
      this.selectedCategoryId();

    if (
      categoryId !== null
    ) {

      queryParams['category'] =
        String(categoryId);

    }


    const subCategoryId =
      this.selectedSubCategoryId();

    if (
      subCategoryId !== null
    ) {

      queryParams['subcategory'] =
        String(subCategoryId);

    }


    const brandId =
      this.selectedBrandId();

    if (
      brandId !== null
    ) {

      queryParams['brand'] =
        String(brandId);

    }


    if (
      this.showOffers()
    ) {

      queryParams['offers'] =
        'true';

    }


    this.router.navigate(
      ['/products'],
      {
        queryParams
      }
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


    if (
      this.allLoadedProducts().length > 0
    ) {

      const cached =
        this.allLoadedProducts();

      this.products.set(
        cached
      );

      this.applyNameFilter();

      this.resetQuantities(
        cached
      );

      this.isLoading.set(false);

    }


    this.router.navigate(
      ['/products'],
      {
        queryParams: {}
      }
    );

  }


  // ========================================================
  // NAME SEARCH
  // ========================================================

  onNameChange(): void {

    this.applyNameFilter();

  }


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
      this.products()
        .filter(product => {

          const nameEn =
            product.nameEn
              ?.toLowerCase() ??
            '';

          const nameAr =
            product.nameAr
              ?.toLowerCase() ??
            '';

          return (
            nameEn.includes(search) ||
            nameAr.includes(search)
          );

        });


    this.filteredProducts.set(
      filtered
    );

  }


  // ========================================================
  // SELECTED CATEGORY NAME
  // ========================================================

  get selectedCategoryName(): string {

    const id =
      this.selectedCategoryId();

    if (
      id === null
    ) {

      return '';

    }

    const category =
      this.categories()
        .find(
          category =>
            Number(
              category.id
            ) === id
        );

    if (!category) {

      return '';

    }

    return this.getCategoryName(
      category
    );

  }


  // ========================================================
  // SELECTED SUBCATEGORY NAME
  // ========================================================

  get selectedSubCategoryName(): string {

    const id =
      this.selectedSubCategoryId();

    if (
      id === null
    ) {

      return '';

    }


    /*
     * Search all categories because the selected
     * category might have been cleared.
     */

    for (
      const category of
      this.categories()
    ) {

      const subCategory =
        category.subCategories.find(
          sub =>
            Number(
              sub.id
            ) === id
        );

      if (
        subCategory
      ) {

        return this.getSubCategoryName(
          subCategory
        );

      }

    }

    return '';

  }


  // ========================================================
  // SELECTED BRAND NAME
  // ========================================================

  get selectedBrandName(): string {

    const id =
      this.selectedBrandId();

    if (
      id === null
    ) {

      return '';

    }

    const brand =
      this.brands()
        .find(
          brand =>
            Number(
              brand.id
            ) === id
        );

    if (!brand) {

      return '';

    }

    return this.getBrandName(
      brand
    );

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


  getQuantity(
    productId: number
  ): number {

    return (
      this.quantities()[productId] ??
      0
    );

  }


  // ========================================================
  // CART
  // ========================================================

  addToCart(
    product: Product
  ): void {

    if (
      !product.isInStock
    ) {

      return;

    }

    this.cartService.addToCart(
      product,
      1
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

    if (
      !imageUrl
    ) {

      return 'assets/images/product-placeholder.png';

    }

    if (
      imageUrl.startsWith(
        'http://'
      ) ||
      imageUrl.startsWith(
        'https://'
      )
    ) {

      return imageUrl;

    }

    return `${this.api}${imageUrl}`;

  }

}