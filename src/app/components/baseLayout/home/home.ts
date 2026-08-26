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
import { Categories } from '../categories/categories';
import { Brands } from '../brands/brands';




interface HomeSlide {
  image: string;
  title: string;
  description: string;
}





@Component({
  selector: 'app-home',

  standalone: true,

  imports: [
    CommonModule,
    MatIconModule,
    Categories,
    Brands
  ],

  templateUrl: './home.html',

  styleUrls: [
    './home.scss'
  ]
})
export class Home
  implements OnInit, OnDestroy {


 


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
  // CONSTRUCTOR
  // =====================================================

  constructor(


    private router:
      Router

  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

  

    this.startSlider();

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