import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

import { BrandService } from '../../../services/brand.service';
import { LanguageService } from '../../../services/language.service';
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
export class Brands
  implements OnInit, AfterViewInit, OnDestroy {

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

  isAtStart = signal(true);

  isAtEnd = signal(true);

  // =====================================================
  // BRAND TRACK
  // =====================================================

  @ViewChild('brandTrack')
  brandTrack?: ElementRef<HTMLDivElement>;

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
  // VIEW INIT
  // =====================================================

  ngAfterViewInit(): void {
    this.initializeCarouselObserver();

    this.scheduleCarouselUpdate();
  }

  // =====================================================
  // DESTROY
  // =====================================================

  ngOnDestroy(): void {

    this.resizeObserver?.disconnect();

    const track = this.brandTrack?.nativeElement;

    if (track) {
      track.removeEventListener(
        'scroll',
        this.handleTrackScroll
      );
    }

    if (this.scrollUpdateFrame) {
      cancelAnimationFrame(
        this.scrollUpdateFrame
      );
    }
  }

  // =====================================================
  // WINDOW RESIZE
  // =====================================================

  @HostListener('window:resize')
  onWindowResize(): void {
    this.scheduleCarouselUpdate();
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

    const track =
      this.brandTrack?.nativeElement;

    if (
      !track ||
      !this.hasBrandOverflow()
    ) {
      return;
    }

    const scrollAmount = Math.max(
      track.clientWidth * 0.8,
      200
    );

    const maxScrollLeft =
      track.scrollWidth -
      track.clientWidth;

    const currentScrollLeft =
      track.scrollLeft;

    let targetScrollLeft: number;

    if (direction === 'left') {

      targetScrollLeft =
        currentScrollLeft -
        scrollAmount;

    } else {

      targetScrollLeft =
        currentScrollLeft +
        scrollAmount;
    }

    targetScrollLeft = Math.max(
      0,
      Math.min(
        targetScrollLeft,
        maxScrollLeft
      )
    );

    track.scrollTo({
      left: targetScrollLeft,
      behavior: 'smooth'
    });

    this.scheduleCarouselUpdate();
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

          /*
           * Wait until Angular renders the
           * newly loaded brands.
           */
          this.scheduleCarouselUpdate();
        },

        error: (error) => {

          console.error(
            'BRANDS ERROR:',
            error
          );

          this.brands.set([]);

          this.isLoadingBrands.set(false);

          this.scheduleCarouselUpdate();
        }
      });
  }

  // =====================================================
  // INITIALIZE CAROUSEL
  // =====================================================

  private initializeCarouselObserver(): void {

    const track =
      this.brandTrack?.nativeElement;

    if (!track) {
      return;
    }

    /*
     * Detect changes in the actual size
     * of the carousel.
     */
    this.resizeObserver =
      new ResizeObserver(() => {
        this.scheduleCarouselUpdate();
      });

    this.resizeObserver.observe(track);

    /*
     * Detect manual touch/mouse scrolling.
     */
    track.addEventListener(
      'scroll',
      this.handleTrackScroll,
      {
        passive: true
      }
    );
  }

  // =====================================================
  // TRACK SCROLL
  // =====================================================

  private readonly handleTrackScroll = (): void => {
    this.scheduleCarouselUpdate();
  };

  // =====================================================
  // UPDATE CAROUSEL STATE
  // =====================================================

  private updateCarousel(): void {

    const track =
      this.brandTrack?.nativeElement;

    if (!track) {
      return;
    }

    /*
     * Actual overflow detection.
     */
    const hasOverflow =
      track.scrollWidth >
      track.clientWidth + 1;

    this.hasBrandOverflow.set(
      hasOverflow
    );

    /*
     * Center when everything fits.
     *
     * Start from the beginning when
     * horizontal scrolling is required.
     */
    track.style.justifyContent =
      hasOverflow
        ? 'flex-start'
        : 'center';

    /*
     * No overflow means there is
     * nowhere to scroll.
     */
    if (!hasOverflow) {

      this.isAtStart.set(true);
      this.isAtEnd.set(true);

      if (track.scrollLeft !== 0) {
        track.scrollLeft = 0;
      }

      return;
    }

    const maxScrollLeft =
      track.scrollWidth -
      track.clientWidth;

    const currentScrollLeft =
      track.scrollLeft;

    const tolerance = 2;

    this.isAtStart.set(
      currentScrollLeft <= tolerance
    );

    this.isAtEnd.set(
      currentScrollLeft >=
      maxScrollLeft - tolerance
    );
  }

  // =====================================================
  // SCHEDULE UPDATE
  // =====================================================

  private scheduleCarouselUpdate(): void {

    if (this.scrollUpdateFrame) {
      cancelAnimationFrame(
        this.scrollUpdateFrame
      );
    }

    this.scrollUpdateFrame =
      requestAnimationFrame(() => {

        this.scrollUpdateFrame =
          undefined;

        this.updateCarousel();
      });
  }
}