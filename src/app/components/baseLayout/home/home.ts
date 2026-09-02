import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { Categories } from '../categories/categories';
import { Brands } from '../brands/brands';
import { SliderService } from '../../../services/slider.service';
import { environment } from '../../../../environments/environment';
import { TranslatePipe } from '@ngx-translate/core';

interface HomeSlide {
  id: number;
  imageUrl: string;
}

@Component({
  selector: 'app-home',
  standalone: true,

  imports: [
    CommonModule,
    MatIconModule,
    Categories,
    Brands,
    TranslatePipe
  ],

  templateUrl: './home.html',

  styleUrls: [
    './home.scss'
  ]
})
export class Home implements OnInit, OnDestroy {

  // =====================================================
  // SERVICES
  // =====================================================

  private readonly sliderService = inject(SliderService);

  constructor(
    private router: Router
  ) {}

  // =====================================================
  // SLIDER
  // =====================================================

  currentSlide = signal(0);

  slides = signal<HomeSlide[]>([]);

  private sliderInterval:
    ReturnType<typeof setInterval> | null = null;

  api = environment.imageApiBaseUrl;

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.loadSliders();
  }

  // =====================================================
  // LOAD SLIDERS
  // =====================================================

  private loadSliders(): void {

    this.sliderService.getSliders()
      .subscribe({

        next: (response: HomeSlide[]) => {

          console.log('Sliders:', response);

          this.slides.set(response ?? []);

          // Reset current slide
          this.currentSlide.set(0);

          // Start automatic slider
          this.startSlider();
        },

        error: (error) => {

          console.error(
            'Failed to load sliders:',
            error
          );

          this.slides.set([]);
        }

      });
  }

  // =====================================================
  // GET IMAGE
  // =====================================================

  getCategoryImage(slider: HomeSlide): string {

    if (
      !slider.imageUrl ||
      slider.imageUrl.trim() === ''
    ) {
      return 'assets/images/category-placeholder.jpg';
    }

    return this.api + slider.imageUrl;
  }

  // =====================================================
  // START SLIDER
  // =====================================================

  private startSlider(): void {

    // Stop existing timer first
    this.stopSlider();

    // No need for timer with 0 or 1 slide
    if (this.slides().length <= 1) {
      return;
    }

    this.sliderInterval = setInterval(() => {

      this.nextSlide(false);

    }, 4000);
  }

  // =====================================================
  // STOP SLIDER
  // =====================================================

  private stopSlider(): void {

    if (this.sliderInterval !== null) {

      clearInterval(
        this.sliderInterval
      );

      this.sliderInterval = null;
    }
  }

  // =====================================================
  // NEXT SLIDE
  // =====================================================

  nextSlide(
    restartTimer: boolean = true
  ): void {

    const slides = this.slides();

    if (slides.length <= 1) {
      return;
    }

    const next =
      (this.currentSlide() + 1) %
      slides.length;

    this.currentSlide.set(next);

    if (restartTimer) {
      this.startSlider();
    }
  }

  // =====================================================
  // PREVIOUS SLIDE
  // =====================================================

  previousSlide(): void {

    const slides = this.slides();

    if (slides.length <= 1) {
      return;
    }

    const previous =
      this.currentSlide() === 0
        ? slides.length - 1
        : this.currentSlide() - 1;

    this.currentSlide.set(previous);

    this.startSlider();
  }

  // =====================================================
  // GO TO SLIDE
  // =====================================================

  goToSlide(index: number): void {

    const slides = this.slides();

    if (
      index < 0 ||
      index >= slides.length
    ) {
      return;
    }

    this.currentSlide.set(index);

    this.startSlider();
  }

  // =====================================================
  // SHOP NOW
  // =====================================================

  shopNow(): void {

    this.router.navigate([
      '/products'
    ]);
  }

  // =====================================================
  // DESTROY
  // =====================================================

  ngOnDestroy(): void {

    this.stopSlider();
  }
}