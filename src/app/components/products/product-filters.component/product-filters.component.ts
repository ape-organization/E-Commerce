import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MaterialModule } from '../../../shared/AngularMaterial';

import { TranslatePipe } from '@ngx-translate/core';

import { CategoryFilter } from '../../../models/category.model';
import { SubCategoryFilter } from '../../../models/subCategory.model';
import { BrandFilter } from '../../../models/brand.model';
import { ProductFilterValue } from '../../../models/product.model';

import { LanguageService } from '../../../services/language.service';

import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-product-filters',
  standalone: true,
  imports: [
    MatSelectModule,
    CommonModule,
    FormsModule,
    MaterialModule,
    TranslatePipe
  ],
  templateUrl: './product-filters.component.html',
  styleUrls: ['./product-filters.component.scss']
})
export class ProductFiltersComponent
  implements OnInit, OnChanges {

  // ========================================================
  // INPUTS
  // ========================================================

  @Input()
  categories: CategoryFilter[] = [];

  @Input()
  subCategories: SubCategoryFilter[] = [];

  @Input()
  brands: BrandFilter[] = [];

  @Input()
  selectedCategoryId: number | null = null;

  @Input()
  selectedSubCategoryId: number | null = null;

  @Input()
  selectedBrandId: number | null = null;

  @Input()
  showOffers = false;


  // ========================================================
  // OUTPUTS
  // ========================================================

  @Output()
  filterApplied =
    new EventEmitter<ProductFilterValue>();

  @Output()
  clearFiltersEvent =
    new EventEmitter<void>();


  // ========================================================
  // TEMPORARY VALUES
  // 0 = ALL
  // ========================================================

  tempCategoryId = 0;

  tempSubCategoryId = 0;

  tempBrandId = 0;

  tempOffers = false;


  // ========================================================
  // CONSTRUCTOR
  // ========================================================

  constructor(
    public languageService: LanguageService
  ) {}


  // ========================================================
  // INIT
  // ========================================================

  ngOnInit(): void {
    this.syncInputs();
  }


  // ========================================================
  // INPUT CHANGES
  // ========================================================

  ngOnChanges(
    changes: SimpleChanges
  ): void {

    if (
      changes['selectedCategoryId'] ||
      changes['selectedSubCategoryId'] ||
      changes['selectedBrandId'] ||
      changes['showOffers']
    ) {
      this.syncInputs();
    }
  }


  // ========================================================
  // SYNC INPUTS
  // ========================================================

  syncInputs(): void {

    /*
     * null from parent = 0 in the dropdown
     *
     * This makes "All Categories",
     * "All Subcategories" and "All Brands"
     * appear automatically.
     */

    this.tempCategoryId =
      this.selectedCategoryId ?? 0;

    this.tempSubCategoryId =
      this.selectedSubCategoryId ?? 0;

    this.tempBrandId =
      this.selectedBrandId ?? 0;

    this.tempOffers =
      this.showOffers;
  }


  // ========================================================
  // CATEGORY CHANGE
  // ========================================================

  onCategoryChange(): void {

    /*
     * Whenever category changes,
     * reset subcategory to ALL.
     */

    this.tempSubCategoryId = 0;
  }


  // ========================================================
  // APPLY FILTERS
  // ========================================================

  applyFilters(): void {

    this.filterApplied.emit({

      /*
       * 0 = ALL
       * Backend expects null when no filter is selected.
       */

      categoryId:
        this.tempCategoryId === 0
          ? null
          : this.tempCategoryId,

      subCategoryId:
        this.tempSubCategoryId === 0
          ? null
          : this.tempSubCategoryId,

      brandId:
        this.tempBrandId === 0
          ? null
          : this.tempBrandId,

      offers:
        this.tempOffers
    });
  }


  // ========================================================
  // CLEAR FILTERS
  // ========================================================

  clearFilters(): void {

    /*
     * 0 means ALL in the UI.
     */

    this.tempCategoryId = 0;

    this.tempSubCategoryId = 0;

    this.tempBrandId = 0;

    this.tempOffers = false;

    this.clearFiltersEvent.emit();
  }


  // ========================================================
  // AVAILABLE SUBCATEGORIES
  // ========================================================

  get availableSubCategories():
    SubCategoryFilter[] {

    /*
     * No category selected = no specific
     * category subcategories.
     */

    if (this.tempCategoryId === 0) {
      return [];
    }

    const category =
      this.categories.find(
        category =>
          Number(category.id) ===
          Number(this.tempCategoryId)
      );

    return category?.subCategories ?? [];
  }


  // ========================================================
  // CATEGORY NAME
  // ========================================================

  getCategoryName(
    category: CategoryFilter
  ): string {

    if (
      this.languageService.isArabic()
    ) {

      return (
        category.nameAr?.trim() ||
        category.nameEn?.trim() ||
        ''
      );

    }

    return (
      category.nameEn?.trim() ||
      category.nameAr?.trim() ||
      ''
    );
  }


  // ========================================================
  // SUBCATEGORY NAME
  // ========================================================

  getSubCategoryName(
    subCategory: SubCategoryFilter
  ): string {

    if (
      this.languageService.isArabic()
    ) {

      return (
        subCategory.nameAr?.trim() ||
        subCategory.nameEn?.trim() ||
        ''
      );

    }

    return (
      subCategory.nameEn?.trim() ||
      subCategory.nameAr?.trim() ||
      ''
    );
  }


  // ========================================================
  // BRAND NAME
  // ========================================================

  getBrandName(
    brand: BrandFilter
  ): string {

    if (
      this.languageService.isArabic()
    ) {

      return (
        brand.nameAr?.trim() ||
        brand.nameEn?.trim() ||
        ''
      );

    }

    return (
      brand.nameEn?.trim() ||
      brand.nameAr?.trim() ||
      ''
    );
  }

}