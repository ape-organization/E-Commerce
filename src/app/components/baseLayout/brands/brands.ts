import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

import {
  
  BrandService
} from '../../../services/brand.service';

import {
  LanguageService
} from '../../../services/language.service';

import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Brand } from '../../../models/brand.model';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    TranslatePipe
  ],
  templateUrl: './brands.html',
  styleUrl: './brands.scss'
})
export class Brands implements OnInit {

  // =====================================================
  // BRANDS
  // =====================================================

  brands = signal<Brand[]>([]);

  isLoadingBrands = signal(true);

  // =====================================================
  // API
  // =====================================================

  api = environment.imageApiBaseUrl;

  // =====================================================
  // BRAND TRACK
  // =====================================================

  @ViewChild('brandTrack')
  brandTrack!: ElementRef<HTMLDivElement>;

  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private brandService: BrandService,
    private router: Router,
    public languageService: LanguageService
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
  // BRAND SCROLL
  // =====================================================

  scrollBrands(
    direction: 'left' | 'right'
  ): void {

    if (!this.brandTrack) {
      return;
    }

    const element =
      this.brandTrack.nativeElement;

    const scrollAmount =
      element.clientWidth * 0.8;

    element.scrollBy({
      left:
        direction === 'left'
          ? -scrollAmount
          : scrollAmount,

      behavior: 'smooth'
    });
  }

  // =====================================================
  // BRAND SELECT
  // =====================================================

  selectBrand(brand: Brand): void {

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

    this.brandService
      .getBrands()
      .subscribe({

        next: (response) => {

          const data =
            response?.data ?? response;

          this.brands.set(
            data ?? []
          );

          this.isLoadingBrands.set(false);
        },

        error: (error) => {

          console.error(
            'BRANDS ERROR:',
            error
          );

          this.brands.set([]);

          this.isLoadingBrands.set(false);
        }
      });
  }
}