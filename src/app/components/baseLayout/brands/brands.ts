import { Component, ElementRef, OnInit, signal, ViewChild } from '@angular/core';
import { Brand, BrandService } from '../../../services/brand.service';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-brands',
  imports: [CommonModule,MatIconModule],
  templateUrl: './brands.html',
  styleUrl: './brands.scss',
})
export class Brands implements OnInit   {
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
  // BRAND SCROLL
  // =====================================================

scrollBrands(direction: 'left' | 'right'): void {

  if (!this.brandTrack) {
    return;
  }

  const element = this.brandTrack.nativeElement;

  const scrollAmount = element.clientWidth * 0.8;

  element.scrollBy({
    left: direction === 'left'
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

 /*  private loadBrands(): void {

    this.brandService
      .getBrands()
      .subscribe({

        next: (response: any) => {
console.log(response)
          


          const data =
            response?.data ?? response;


          this.brands.set(

            (data ?? []).filter(
              (brand: Brand) =>
                brand
            )

          );
console.log(this.brands)

          this.isLoadingBrands .set(
            false)

        },


        error: (error) => {

          console.error(
            'Error loading brands:',
            error
          );


          this.brands.set([]);

          this.isLoadingBrands .set(
            false)

        }

      });

  } */
private loadBrands(): void {


  this.brandService.getBrands().subscribe({

    next: (response) => {

      const data = response?.data ?? response;

      this.brands.set(data ?? []);

      this.isLoadingBrands.set(false);
    },

    error: (error) => {

      this.brands.set([]);
      this.isLoadingBrands.set(false);
    },

    complete: () => {
    }

  });
}


      // =====================================================
  // INIT
  // =====================================================

  ngOnInit() {

    this.loadBrands();

   

  }
  
  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(

  

    private brandService:
      BrandService,

    private router:
      Router

  ) {}
  
  // =====================================================
  // BRANDS
  // =====================================================

  brands =
    signal<Brand[]>([]);


  isLoadingBrands =signal(
    true);
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
}
