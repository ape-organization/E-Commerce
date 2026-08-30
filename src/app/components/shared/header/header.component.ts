
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
import { MaterialModule } from '../../../shared/AngularMaterial';
import { CategoryService } from '../../../services/category.service';
import { BrandService } from '../../../services/brand.service';
import { CartService } from '../../../services/cart.service';
import { Category } from '../../../models/category.model';
import { Brand } from '../../../models/brand.model';
import { LanguageService } from '../../../services/language.service';
import { TranslatePipe } from '@ngx-translate/core';

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
public languageService=inject( LanguageService)

  // ==========================================================
  // CART
  // ==========================================================

  cartCount = signal(0);


  // ==========================================================
  // MOBILE BOTTOM NAV
  // ==========================================================

  showBottomNav = signal(false);


  // ==========================================================
  // MENU STATE
  // ==========================================================

  categoryMenuOpen = signal(false);

  brandMenuOpen = signal(false);

  expandedCategoryId =
    signal<number | null>(null);

  mobileMenuOpen = signal(false);


  // ==========================================================
  // CATEGORIES
  // ==========================================================

  categories = signal<Category[]>([]);

  isLoadingCategories = signal(false);

  categoryError =
    signal<string | null>(null);


  // ==========================================================
  // BRANDS
  // ==========================================================

  brands = signal<Brand[]>([]);

  isLoadingBrands = signal(false);

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
  // CART
  // ==========================================================

  private loadCartCount(): void {

    this.cartService.cartCount$
      .subscribe(count => {

        this.cartCount.set(count);

      });

  }


  // ==========================================================
  // SCROLL
  // ==========================================================

  @HostListener('window:scroll')
  onWindowScroll(): void {

    this.showBottomNav.set(
      window.scrollY > 100
    );

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
            response?.data ?? response ?? [];

          const mappedCategories: Category[] =
            data.map((category: any) => ({

              id: category.id,

              name: category.name,

              subCategories:
                category.subCategories ??
                category.subcategories ??
                []

            }));

          this.categories.set(
            mappedCategories
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
            response?.data ?? response ?? [];

          this.brands.set(data);

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

      this.expandedCategoryId.set(null);

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

