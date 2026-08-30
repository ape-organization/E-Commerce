import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CategoryService } from '../../../services/category.service';
import { environment } from '../../../../environments/environment';
import { Category } from '../../../models/category.model';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-categories',
  imports: [CommonModule,MatIconModule,TranslatePipe],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
})
export class Categories {
  // =====================================================
  // CATEGORY SCROLL
  // =====================================================

 scrollCategories(direction: 'left' | 'right'): void {

  if (!this.categoryTrack) {
    return;
  }

  const element = this.categoryTrack.nativeElement;

  const scrollAmount = element.clientWidth * 0.8;

  element.scrollBy({
    left: direction === 'left'
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

          this.isLoadingCategories .set(
            false)

        },


        error: (error) => {



          this.categories.set([]);

          this.isLoadingCategories .set(
            false)

        }

      });

  }



// =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    this.loadCategories();

   

  }
  
  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(

    private categoryService:
      CategoryService,

   

    private router:
      Router

  ) {}
    // =====================================================
  // CATEGORIES
  // =====================================================

  categories =
    signal<Category[]>([]);


  isLoadingCategories =signal(
    true)
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
}
