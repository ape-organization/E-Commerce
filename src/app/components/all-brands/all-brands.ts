import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import {
  Brand,
  BrandService
} from '../../services/brand.service';

import { environment } from '../../../environments/environment';

import { finalize } from 'rxjs';


@Component({
  selector: 'app-all-brands',

  standalone: true,

  imports: [
    CommonModule,
    MatIconModule
  ],

  templateUrl: './all-brands.html',

  styleUrl: './all-brands.scss'
})
export class AllBrands implements OnInit {


  // =====================================================
  // API
  // =====================================================

  api = environment.imageApiBaseUrl;


  // =====================================================
  // BRANDS
  // =====================================================

  brands = signal<Brand[]>([]);

  isLoadingBrands = true;


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private brandService: BrandService,
    private router: Router
  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.loadBrands();

  }


  // =====================================================
  // LOAD BRANDS
  // =====================================================

  private loadBrands(): void {

    this.isLoadingBrands = true;

    console.log('Loading brands...');


    this.brandService
      .getBrands()

      .pipe(

        finalize(() => {

          console.log(
            'Finished loading brands'
          );

          this.isLoadingBrands = false;

        })

      )

      .subscribe({

        next: (response: any) => {

          console.log(
            'Brands API response:',
            response
          );


          // Handle:
          // [ ... ]
          //
          // OR
          //
          // { data: [ ... ] }

          const data =
            Array.isArray(response)
              ? response
              : response?.data ?? [];


          console.log(
            'Brands data:',
            data
          );


          this.brands.set(
            data.filter(
              (brand: Brand) =>
                brand != null
            )
          );


          console.log(
            'Brands signal:',
            this.brands()
          );

        },


        error: (error) => {

          console.error(
            'Error loading brands:',
            error
          );


          this.brands.set([]);

        }

      });

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


    return this.api + brand.imageUrl;

  }


  // =====================================================
  // SELECT BRAND
  // =====================================================

  selectBrand(
    brand: Brand
  ): void {

    console.log(
      'Selected brand:',
      brand
    );


    this.router.navigate(
      ['/products'],
      {
        queryParams: {
          brand: brand.name
        }
      }
    );

  }

}