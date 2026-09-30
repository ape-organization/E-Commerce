import { Component, signal } from '@angular/core';
import { Brands } from '../brands/brands';
import { Brand } from '../../../models/brand.model';
import { LanguageService } from '../../../services/language.service';
import { Router } from '@angular/router';
import { BrandService } from '../../../services/brand.service';
import { environment } from '../../../../environments/environment';
import { translate, TranslatePipe } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-all-brands',
  imports: [TranslatePipe,CommonModule],
  templateUrl: './all-brands.html',
  styleUrl: './all-brands.scss',
})
export class AllBrands {


  // =====================================================
  // BRANDS
  // =====================================================

  brands = signal<Brand[]>([]);

  isLoadingBrands = signal(true);

  // =====================================================
  // API
  // =====================================================

  readonly api = environment.imageApiBaseUrl;

  // =====================================================
  // CAROUSEL STATE
  // =====================================================

  hasBrandOverflow = signal(false);


  // =====================================================
  // RESIZE OBSERVER
  // =====================================================

  private resizeObserver?: ResizeObserver;

  // =====================================================
  // ANIMATION FRAME
  // =====================================================

  private scrollUpdateFrame?: number;

  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private readonly brandService: BrandService,
    private readonly router: Router,
    public readonly languageService: LanguageService
  ) {}

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.loadBrands();
  }


  // =====================================================
  // BRAND NAME
  // =====================================================

  getBrandName(brand: Brand): string {

    if (this.languageService.isArabic()) {

      return brand.nameAr?.trim()
        ? brand.nameAr
        : brand.nameEn;
    }

    return brand.nameEn?.trim()
      ? brand.nameEn
      : brand.nameAr;
  }

  // =====================================================
  // BRAND IMAGE
  // =====================================================

  getBrandImage(brand: Brand): string {

    if (
      !brand.imageUrl ||
      brand.imageUrl.trim() === ''
    ) {
      return 'assets/images/category-placeholder.jpg';
    }

    return this.api + brand.imageUrl;
  }


  // =====================================================
  // BRAND SELECT
  // =====================================================

  selectBrand(brand: Brand): void {

    if (!brand?.id) {
      return;
    }

    this.router.navigate(
      ['/products'],
      {
        queryParams: {
          brand: brand.id
        }
      }
    );
  }

  // =====================================================
  // LOAD BRANDS
  // =====================================================

  private loadBrands(): void {

    this.isLoadingBrands.set(true);

    this.brandService
      .getBrands()
      .subscribe({

        next: (response) => {

          const data =
            response?.data ??
            response ??
            [];

          this.brands.set(data);

          this.isLoadingBrands.set(false);

        },

        error: (error) => {
 this.brands.set([]);

          this.isLoadingBrands.set(false);

       
        }
      });
  }

}
