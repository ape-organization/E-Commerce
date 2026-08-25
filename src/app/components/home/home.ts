import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';

import { Router } from '@angular/router';

import { CategoryService } from '../../services/category.service';

import {
  BrandService,
  Brand
} from '../../services/brand.service';

import { environment } from '../../../environments/environment';


interface HomeSlide {
  image: string;
  title: string;
  description: string;
}


interface Category {
  id: number;
  name: string;
  imageUrl?: string;
}


@Component({
  selector: 'app-home',

  standalone: true,

  imports: [
    CommonModule,
    MatIconModule
  ],

  templateUrl: './home.html',

  styleUrls: [
    './home.scss'
  ]
})
export class Home
  implements OnInit, OnDestroy {


  // =====================================================
  // CATEGORY TRACK
  // =====================================================

  @ViewChild('categoryTrack')
  categoryTrack!: ElementRef<HTMLDivElement>;


  // =====================================================
  // BRAND TRACK
  // =====================================================

  @ViewChild('brandTrack')
  brandTrack!: ElementRef<HTMLDivElement>;


  // =====================================================
  // API
  // =====================================================

  api =
    environment.imageApiBaseUrl;


  // =====================================================
  // SLIDER
  // =====================================================

  currentSlide =
    signal(0);


  private sliderInterval:
    ReturnType<typeof setInterval> | null = null;


  slides: HomeSlide[] = [

    {
      image: 'assets/images/slider2.jpg',

      title: 'Beauty Begins With You',

      description:
        'Discover our carefully selected collection of beauty and skincare products.'
    },

    {
      image: 'assets/images/slider1.jpg',

      title: 'Feel Beautiful Every Day',

      description:
        'Everything you need for your daily beauty routine.'
    },

    {
      image: 'assets/images/slider3.jpg',

      title: 'Your Beauty Collection',

      description:
        'Explore products designed to make every moment feel special.'
    }

  ];


  // =====================================================
  // CATEGORIES
  // =====================================================

  categories =
    signal<Category[]>([]);


  isLoadingCategories =
    true;


  // =====================================================
  // BRANDS
  // =====================================================

  brands =
    signal<Brand[]>([]);


  isLoadingBrands =
    true;


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(

    private categoryService:
      CategoryService,

    private brandService:
      BrandService,

    private router:
      Router

  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    this.loadCategories();

    this.loadBrands();

    this.startSlider();

  }


  // =====================================================
  // LOAD CATEGORIES
  // =====================================================

  private loadCategories(): void {

    this.categoryService
      .getAllCategories()
      .subscribe({

        next: (response: any) => {

         


          const data =
            response?.data ?? response;


          this.categories.set(

            (data ?? []).filter(
              (category: Category) =>
                category
            )

          );


          this.isLoadingCategories =
            false;

        },


        error: (error) => {

          console.error(
            'Error loading categories:',
            error
          );


          this.categories.set([]);

          this.isLoadingCategories =
            false;

        }

      });

  }


  // =====================================================
  // LOAD BRANDS
  // =====================================================

  private loadBrands(): void {

    this.brandService
      .getBrands()
      .subscribe({

        next: (response: any) => {

          


          const data =
            response?.data ?? response;


          this.brands.set(

            (data ?? []).filter(
              (brand: Brand) =>
                brand
            )

          );


          this.isLoadingBrands =
            false;

        },


        error: (error) => {

          console.error(
            'Error loading brands:',
            error
          );


          this.brands.set([]);

          this.isLoadingBrands =
            false;

        }

      });

  }


  // =====================================================
  // CATEGORY IMAGE
  // =====================================================

  getCategoryImage(
    category: Category
  ): string {

    if (
      !category.imageUrl ||
      category.imageUrl.trim() === ''
    ) {

      return 'assets/images/category-placeholder.jpg';

    }


    return this.api +
      category.imageUrl;

  }


  // =====================================================
  // BRAND IMAGE
  // =====================================================

  getBrandImage(
    brand: Brand
  ): string {

    if (
      !brand.imageUrl ||
      brand.imageUrl.trim() === ''
    ) {

      return 'assets/images/category-placeholder.jpg';

    }


    return this.api +
      brand.imageUrl;

  }


  // =====================================================
  // START SLIDER
  // =====================================================

  private startSlider(): void {

    this.stopSlider();


    this.sliderInterval =
      setInterval(() => {

        this.nextSlide(false);

      }, 4000);

  }


  // =====================================================
  // STOP SLIDER
  // =====================================================

  private stopSlider(): void {

    if (
      this.sliderInterval !== null
    ) {

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

    if (
      this.slides.length === 0
    ) {

      return;

    }


    const next =
      (
        this.currentSlide() + 1
      ) %
      this.slides.length;


    this.currentSlide.set(
      next
    );


    if (restartTimer) {

      this.startSlider();

    }

  }


  // =====================================================
  // PREVIOUS SLIDE
  // =====================================================

  previousSlide(): void {

    if (
      this.slides.length === 0
    ) {

      return;

    }


    const previous =
      this.currentSlide() === 0

        ? this.slides.length - 1

        : this.currentSlide() - 1;


    this.currentSlide.set(
      previous
    );


    this.startSlider();

  }


  // =====================================================
  // GO TO SLIDE
  // =====================================================

  goToSlide(
    index: number
  ): void {

    if (
      index < 0 ||
      index >= this.slides.length
    ) {

      return;

    }


    this.currentSlide.set(
      index
    );


    this.startSlider();

  }


  // =====================================================
  // CATEGORY SCROLL
  // =====================================================

  scrollCategories(
    direction: 'left' | 'right'
  ): void {

    if (!this.categoryTrack) {

      return;

    }


    const element =
      this.categoryTrack
        .nativeElement;


    const scrollAmount = 300;


    element.scrollBy({

      left:
        direction === 'left'
          ? -scrollAmount
          : scrollAmount,

      behavior: 'smooth'

    });

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
      this.brandTrack
        .nativeElement;


    const scrollAmount = 300;


    element.scrollBy({

      left:
        direction === 'left'
          ? -scrollAmount
          : scrollAmount,

      behavior: 'smooth'

    });

  }


  // =====================================================
  // CATEGORY SELECT
  // =====================================================
selectCategory(category: Category): void {
    this.router.navigate(
        ['/products'],
        {
            queryParams: {
                category: category.id
            }
        }
    );
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