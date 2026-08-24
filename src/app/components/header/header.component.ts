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
  MaterialModule
} from '../../shared/AngularMaterial';

import {
  MatIconModule
} from '@angular/material/icon';

import {
  CategoryService
} from '../../services/category.service';

import {
  BrandService
} from '../../services/brand.service';

import {
  CartService
} from '../../services/cart.service';


// ============================================================
// MODELS
// ============================================================

interface SubCategory {

  id: number;

  name: string;

}


interface Category {

  id: number;

  name: string;

  subCategories: SubCategory[];

}


interface Brand {

  id: number;

  name: string;

  imageUrl?: string | null;

}


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

    MatIconModule

  ],

  templateUrl:
    './header.component.html',

  styleUrl:
    './header.component.css'

})
export class HeaderComponent
  implements OnInit {


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


  // ==========================================================
  // CART
  // ==========================================================

  cartCount =
    signal(0);


  // ==========================================================
  // MOBILE BOTTOM NAV
  // ==========================================================

  showBottomNav =
    signal(false);


  // ==========================================================
  // MENU STATE
  // ==========================================================

  categoryMenuOpen =
    signal(false);

  brandMenuOpen =
    signal(false);

  shopOpen =
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
  // SCROLL
  // ==========================================================

  @HostListener(
    'window:scroll',
    []
  )
  onWindowScroll(): void {

    /*
     * Show bottom navigation after
     * the user scrolls down.
     *
     * 100px is enough to avoid showing
     * it immediately when the page opens.
     */

    if (window.scrollY > 100) {

      this.showBottomNav.set(true);

    } else {

      this.showBottomNav.set(false);

    }

  }


  // ==========================================================
  // CART COUNT
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

  }


  closeCategoryMenu(): void {

    this.categoryMenuOpen.set(false);

  }


  toggleCategoryMenu(): void {

    this.categoryMenuOpen.update(
      value => !value
    );

    this.brandMenuOpen.set(false);

  }


  // ==========================================================
  // BRAND MENU
  // ==========================================================

  openBrandMenu(): void {

    this.brandMenuOpen.set(true);

  }


  closeBrandMenu(): void {

    this.brandMenuOpen.set(false);

  }


  toggleBrandMenu(): void {

    this.brandMenuOpen.update(
      value => !value
    );

    this.categoryMenuOpen.set(false);

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
            response?.data ?? response;


          this.categories.set(

            (data ?? []).map(
              (category: any) => ({

                id:
                  category.id,

                name:
                  category.name,

                subCategories:
                  category.subCategories ??
                  category.subcategories ??
                  []

              })
            )

          );


          this.isLoadingCategories.set(false);

        },


        error: (error) => {

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
            response?.data ?? response;


          this.brands.set(
            data ?? []
          );


          this.isLoadingBrands.set(false);

        },


        error: (error) => {

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
  // SHOP
  // ==========================================================

  openShop(): void {

    this.shopOpen.set(true);

  }


  closeShop(): void {

    this.shopOpen.set(false);

    this.expandedCategoryId.set(null);

    this.brandMenuOpen.set(false);

  }


  toggleShop(): void {

    this.shopOpen.update(
      value => !value
    );


    if (!this.shopOpen()) {

      this.expandedCategoryId.set(null);

      this.brandMenuOpen.set(false);

    }

  }


  // ==========================================================
  // CATEGORY
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


    this.brandMenuOpen.set(false);

  }


  // ==========================================================
  // ALL PRODUCTS
  // ==========================================================

  selectAllProducts(): void {

    this.closeAllMenus();

    this.router.navigate(
      ['/products']
    );

  }


  // ==========================================================
  // CHECK PRODUCTS PAGE
  // ==========================================================

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

          subCategory:
            subCategoryId

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

          brand:
            brandId

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

    this.shopOpen.set(false);

    this.expandedCategoryId.set(null);

    this.brandMenuOpen.set(false);

    this.categoryMenuOpen.set(false);

  }


  toggleMobileShop(): void {

    this.shopOpen.update(
      value => !value
    );


    if (!this.shopOpen()) {

      this.expandedCategoryId.set(null);

      this.brandMenuOpen.set(false);

    }

  }


  // ==========================================================
  // CLOSE ALL MENUS
  // ==========================================================

  private closeAllMenus(): void {

    this.shopOpen.set(false);

    this.expandedCategoryId.set(null);

    this.brandMenuOpen.set(false);

    this.categoryMenuOpen.set(false);

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


    const clickedInsideHeader =
      target.closest(
        '.main-header'
      ) !== null;


    const clickedInsideSidebar =
      target.closest(
        '.mobile-sidebar'
      ) !== null;


    const clickedInsideBottomNav =
      target.closest(
        '.mobile-bottom-nav'
      ) !== null;


    if (
      !clickedInsideHeader &&
      !clickedInsideSidebar &&
      !clickedInsideBottomNav
    ) {

      this.closeAllMenus();

    }

  }

}