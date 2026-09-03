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


@Component({
  selector: 'app-product-filters',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    TranslatePipe
  ],

  templateUrl: './product-filters.component.html',

  styleUrls: [
    './product-filters.component.scss'
  ]
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
  // ========================================================

  tempCategoryId: number | null = null;

  tempSubCategoryId: number | null = null;

  tempBrandId: number | null = null;

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

    this.tempCategoryId =
      this.selectedCategoryId;

    this.tempSubCategoryId =
      this.selectedSubCategoryId;

    this.tempBrandId =
      this.selectedBrandId;

    this.tempOffers =
      this.showOffers;

  }


  // ========================================================
  // CATEGORY CHANGE
  // ========================================================

  onCategoryChange(): void {

    this.tempSubCategoryId = null;

  }


  // ========================================================
  // APPLY FILTERS
  // ========================================================

  applyFilters(): void {

    this.filterApplied.emit({

      categoryId:
        this.tempCategoryId,

      subCategoryId:
        this.tempSubCategoryId,

      brandId:
        this.tempBrandId,

      offers:
        this.tempOffers

    });

  }


  // ========================================================
  // CLEAR FILTERS
  // ========================================================

  clearFilters(): void {

    this.tempCategoryId = null;

    this.tempSubCategoryId = null;

    this.tempBrandId = null;

    this.tempOffers = false;

    this.clearFiltersEvent.emit();

  }


  // ========================================================
  // AVAILABLE SUBCATEGORIES
  // ========================================================

  get availableSubCategories():
    SubCategoryFilter[] {

    if (
      this.tempCategoryId === null
    ) {

      return this.subCategories;

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