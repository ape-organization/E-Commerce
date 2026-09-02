import {
  Component,
  HostListener,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  Router,
  RouterModule
} from '@angular/router';

import {
  MatIconModule
} from '@angular/material/icon';

import {
  MaterialModule
} from '../../../shared/AngularMaterial';

import {
  CategoryService
} from '../../../services/category.service';

import {
  BrandService
} from '../../../services/brand.service';

import {
  CartService
} from '../../../services/cart.service';

import {
  Category
} from '../../../models/category.model';

import {
  Brand
} from '../../../models/brand.model';

import {
  LanguageService
} from '../../../services/language.service';

import {
  TranslatePipe
} from '@ngx-translate/core';


// ============================================================
// COMPONENT
// ============================================================

@Component({
  selector: 'app-header',

  standalone: true,

  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    MatIconModule,
    TranslatePipe
  ],

  templateUrl: './header.component.html',

  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {

  // ==========================================================
  // SERVICES
  // ==========================================================

  private readonly categoryService =
    inject(CategoryService);

  private readonly brandService =
    inject(BrandService);

  private readonly cartService =
    inject(CartService);

  private readonly router =
    inject(Router);

  public readonly languageService =
    inject(LanguageService);


  // ==========================================================
  // CART
  // ==========================================================

  cartCount = signal(0);


  // ==========================================================
  // MENU STATE
  // ==========================================================

  categoryMenuOpen =
    signal(false);

  brandMenuOpen =
    signal(false);

  expandedCategoryId =
    signal<number | null>(null);

  mobileMenuOpen =
    signal(false);


  // ==========================================================
  // CATEGORIES
  // ==========================================================

  categories =
    signal<Category[]>([]);

  isLoadingCategories =
    signal(false);

  categoryError =
    signal<string | null>(null);


  // ==========================================================
  // BRANDS
  // ==========================================================

  brands =
    signal<Brand[]>([]);

  isLoadingBrands =
    signal(false);

  brandError =
    signal<string | null>(null);


  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {

    this.loadCategories();

    this.loadBrands();

    this.loadCartCount();

  }


  // ==========================================================
  // LANGUAGE
  // ==========================================================

  getCategoryName(
    category: Category
  ): string {

    if (
      this.languageService.isArabic()
    ) {

      return category.nameAr?.trim()
        ? category.nameAr
        : category.nameEn;

    }

    return category.nameEn?.trim()
      ? category.nameEn
      : category.nameAr;

  }


  getSubCategoryName(
    subCategory: any
  ): string {

    if (
      this.languageService.isArabic()
    ) {

      return subCategory.nameAr?.trim()
        ? subCategory.nameAr
        : subCategory.nameEn;

    }

    return subCategory.nameEn?.trim()
      ? subCategory.nameEn
      : subCategory.nameAr;

  }


  getBrandName(
    brand: Brand
  ): string {

    if (
      this.languageService.isArabic()
    ) {

      return brand.nameAr?.trim()
        ? brand.nameAr
        : brand.nameEn;

    }

    return brand.nameEn?.trim()
      ? brand.nameEn
      : brand.nameAr;

  }


  // ==========================================================
  // CART
  // ==========================================================

  private loadCartCount(): void {

    this.cartService.cartCount$
      .subscribe(count => {

        this.cartCount.set(count);

      });

  }


  // ==========================================================
  // CATEGORY MENU
  // ==========================================================

  openCategoryMenu(): void {

    this.categoryMenuOpen.set(true);

    this.brandMenuOpen.set(false);

  }


  closeCategoryMenu(): void {

    this.categoryMenuOpen.set(false);

  }


  toggleCategoryMenu(): void {

    const open =
      !this.categoryMenuOpen();

    this.categoryMenuOpen.set(open);

    this.brandMenuOpen.set(false);

    if (!open) {

      this.expandedCategoryId.set(null);

    }

  }


  // ==========================================================
  // BRAND MENU
  // ==========================================================

  openBrandMenu(): void {

    this.brandMenuOpen.set(true);

    this.categoryMenuOpen.set(false);

    this.expandedCategoryId.set(null);

  }


  closeBrandMenu(): void {

    this.brandMenuOpen.set(false);

  }


  toggleBrandMenu(): void {

    const open =
      !this.brandMenuOpen();

    this.brandMenuOpen.set(open);

    this.categoryMenuOpen.set(false);

    this.expandedCategoryId.set(null);

  }


  // ==========================================================
  // LOAD CATEGORIES
  // ==========================================================

  loadCategories(): void {

    this.isLoadingCategories.set(true);

    this.categoryError.set(null);

    this.categoryService
      .getCategoriesMenu()
      .subscribe({

        next: (response: any) => {

          const data =
            response?.data ??
            response ??
            [];

          this.categories.set(
            (data ?? []).filter(
              (category: Category) =>
                !!category
            )
          );

          this.isLoadingCategories.set(false);

        },

        error: error => {

          console.error(
            'Error loading categories:',
            error
          );

          this.categoryError.set(
            'Unable to load categories.'
          );

          this.isLoadingCategories.set(false);

        }

      });

  }


  // ==========================================================
  // LOAD BRANDS
  // ==========================================================

  loadBrands(): void {

    this.isLoadingBrands.set(true);

    this.brandError.set(null);

    this.brandService
      .getBrands()
      .subscribe({

        next: (response: any) => {

          const data =
            response?.data ??
            response ??
            [];

          this.brands.set(
            (data ?? []).filter(
              (brand: Brand) =>
                !!brand
            )
          );

          this.isLoadingBrands.set(false);

        },

        error: error => {

          console.error(
            'Error loading brands:',
            error
          );

          this.brandError.set(
            'Unable to load brands.'
          );

          this.isLoadingBrands.set(false);

        }

      });

  }


  // ==========================================================
  // CATEGORY EXPANSION
  // ==========================================================

  toggleCategory(
    categoryId: number
  ): void {

    if (
      this.expandedCategoryId() ===
      categoryId
    ) {

      this.expandedCategoryId.set(
        null
      );

      return;

    }

    this.expandedCategoryId.set(
      categoryId
    );

  }


  // ==========================================================
  // PRODUCTS
  // ==========================================================

  selectAllProducts(): void {

    this.closeAllMenus();

    this.router.navigate([
      '/products'
    ]);

  }


  isProductsPage(): boolean {

    return this.router.url
      .split('?')[0]
      .startsWith('/products');

  }


  // ==========================================================
  // SUBCATEGORY
  // ==========================================================

  selectSubCategory(
    subCategoryId: number
  ): void {

    this.closeAllMenus();

    this.router.navigate(
      ['/products'],
      {
        queryParams: {
          subcategory: subCategoryId
        }
      }
    );

  }


  // ==========================================================
  // OFFERS
  // ==========================================================

  selectOffers(): void {

    this.closeAllMenus();

    this.router.navigate(
      ['/products'],
      {
        queryParams: {
          offers: true
        }
      }
    );

  }


  // ==========================================================
  // BRAND
  // ==========================================================

  selectBrand(
    brandId: number
  ): void {

    this.closeAllMenus();

    this.router.navigate(
      ['/products'],
      {
        queryParams: {
          brand: brandId
        }
      }
    );

  }


  // ==========================================================
  // MOBILE MENU
  // ==========================================================

  openMobileMenu(): void {

    this.mobileMenuOpen.set(true);

  }


  closeMobileMenu(): void {

    this.mobileMenuOpen.set(false);

    this.categoryMenuOpen.set(false);

    this.brandMenuOpen.set(false);

    this.expandedCategoryId.set(null);

  }


  // ==========================================================
  // CLOSE EVERYTHING
  // ==========================================================

  private closeAllMenus(): void {

    this.categoryMenuOpen.set(false);

    this.brandMenuOpen.set(false);

    this.expandedCategoryId.set(null);

    this.mobileMenuOpen.set(false);

  }


  // ==========================================================
  // CLICK OUTSIDE
  // ==========================================================

  @HostListener(
    'document:click',
    ['$event']
  )
  onDocumentClick(
    event: MouseEvent
  ): void {

    const target =
      event.target as HTMLElement;

    const insideHeader =
      !!target.closest('.main-header');

    const insideSidebar =
      !!target.closest('.mobile-sidebar');

    const insideBottomNav =
      !!target.closest('.mobile-bottom-nav');

    if (
      !insideHeader &&
      !insideSidebar &&
      !insideBottomNav
    ) {

      this.closeAllMenus();

    }

  }

}