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

import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';

import { Product } from '../../models/product.model';

import {
  ProductModalComponent
} from '../product-modal/product-modal.component';

import { environment } from '../../../environments/environment';

import { MaterialModule } from '../../shared/AngularMaterial';


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

  templateUrl:
    './product-list.component.html',

  styleUrls: [
    './product-list.component.css'
  ]
})
export class ProductListComponent
  implements OnInit {


  // ==========================================================
  // PRODUCTS
  // ==========================================================

  products: Product[] = [];

  filteredProducts: Product[] = [];


  // ==========================================================
  // QUANTITIES
  // ==========================================================

  quantities: Record<number, number> = {};


  // ==========================================================
  // IMAGE API
  // ==========================================================

  api = environment.imageApiBaseUrl;


  // ==========================================================
  // FILTERS
  // ==========================================================

  categories: string[] = [];

  subCategories: string[] = [];

  selectedCategory = '';

  selectedSubCategory = '';


  // ==========================================================
  // LOADING
  // ==========================================================

  isLoading = true;


  // ==========================================================
  // CONSTRUCTOR
  // ==========================================================

  constructor(
    private productService: ProductService,

    private cartService: CartService,

    private dialog: MatDialog,

    private cdr: ChangeDetectorRef
  ) {}


  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {

    this.loadProducts();

  }


  // ==========================================================
  // LOAD PRODUCTS
  // ==========================================================

  private loadProducts(): void {

    this.isLoading = true;

    this.productService
      .getProducts()
      .subscribe({

        next: (products) => {

       


          // --------------------------------------------------
          // PRODUCTS
          // --------------------------------------------------

          this.products = products.map(
            (product) => ({

              ...product,

              imageUrl:
                product.imageUrl
                  ? this.api + product.imageUrl
                  : null

            })
          );


          // --------------------------------------------------
          // QUANTITIES
          // --------------------------------------------------

          this.quantities = {};

          this.products.forEach(
            product => {

              this.quantities[
                product.id
              ] = 0;

            }
          );


          // --------------------------------------------------
          // GET UNIQUE CATEGORIES
          // --------------------------------------------------

          this.categories = [
            ...new Set(

              this.products
                .flatMap(
                  product =>
                    product.subCategories
                      ?.map(
                        subCategory =>
                          subCategory.categoryName
                      )
                      ?? []
                )

                .filter(
                  (
                    category
                  ): category is string =>
                    !!category
                )

            )
          ];


          // --------------------------------------------------
          // INITIAL PRODUCTS
          // --------------------------------------------------

          this.filteredProducts = [
            ...this.products
          ];


          this.isLoading = false;


          // --------------------------------------------------
          // UPDATE UI
          // --------------------------------------------------

          this.cdr.detectChanges();

        },


        error: (error) => {

        

          this.isLoading = false;

          this.cdr.detectChanges();

        }

      });

  }


  // ==========================================================
  // CATEGORY CHANGE
  // ==========================================================

  onCategoryChange(): void {

    // Reset subcategory
    this.selectedSubCategory = '';


    // No category selected
    if (!this.selectedCategory) {

      this.subCategories = [];

      this.filteredProducts = [
        ...this.products
      ];

      return;
    }


    // --------------------------------------------------------
    // Get subcategories belonging to selected category
    // --------------------------------------------------------

    this.subCategories = [

      ...new Set(

        this.products

          .flatMap(
            product =>
              product.subCategories
                ?.filter(
                  subCategory =>
                    subCategory.categoryName ===
                    this.selectedCategory
                )

                .map(
                  subCategory =>
                    subCategory.name
                )

                ?? []
          )

      )

    ];


    // Apply category filter
    this.applyFilters();

  }


  // ==========================================================
  // SUBCATEGORY CHANGE
  // ==========================================================

  onSubCategoryChange(): void {

    this.applyFilters();

  }


  // ==========================================================
  // APPLY FILTERS
  // ==========================================================

  private applyFilters(): void {

    this.filteredProducts =
      this.products.filter(
        product => {


          // --------------------------------------------------
          // CATEGORY
          // --------------------------------------------------

          const categoryMatch =
            !this.selectedCategory ||

            product.subCategories?.some(
              subCategory =>
                subCategory.categoryName ===
                this.selectedCategory
            );


          // --------------------------------------------------
          // SUBCATEGORY
          // --------------------------------------------------

          const subCategoryMatch =
            !this.selectedSubCategory ||

            product.subCategories?.some(
              subCategory =>
                subCategory.name ===
                this.selectedSubCategory
            );


          return (
            categoryMatch &&
            subCategoryMatch
          );

        }
      );

  }


  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  clearFilters(): void {

    this.selectedCategory = '';

    this.selectedSubCategory = '';

    this.subCategories = [];

    this.filteredProducts = [
      ...this.products
    ];

  }


  // ==========================================================
  // OPEN PRODUCT DETAILS
  // ==========================================================

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


  // ==========================================================
  // ADD TO CART
  // ==========================================================

  addToCart(
    product: Product,
    event: Event
  ): void {

    event.stopPropagation();

if( this.quantities[
        product.id
      ]!=0){
    const quantity =
      this.quantities[
        product.id
      ] || 1;


    this.cartService.addToCart(
      product,
      quantity
    );
  }
  }

}