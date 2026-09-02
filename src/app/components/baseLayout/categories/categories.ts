import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  signal
} from '@angular/core';

import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

import { CategoryService } from '../../../services/category.service';
import { LanguageService } from '../../../services/language.service';

import { environment } from '../../../../environments/environment';
import { Category } from '../../../models/category.model';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    TranslatePipe
  ],
  templateUrl: './categories.html',
  styleUrl: './categories.scss'
})
export class Categories implements OnInit {

  // =====================================================
  // CATEGORIES
  // =====================================================

  categories = signal<Category[]>([]);

  isLoadingCategories = signal(true);

  // =====================================================
  // API
  // =====================================================

  api = environment.imageApiBaseUrl;

  // =====================================================
  // CATEGORY TRACK
  // =====================================================

  @ViewChild('categoryTrack')
  categoryTrack!: ElementRef<HTMLDivElement>;

  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private categoryService: CategoryService,
    private router: Router,
    public languageService: LanguageService
  ) {}

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.loadCategories();
  }

  // =====================================================
  // CATEGORY NAME
  // =====================================================

  getCategoryName(category: Category): string {

    if (this.languageService.isArabic()) {

      return category.nameAr?.trim()
        ? category.nameAr
        : category.nameEn;
    }

    return category.nameEn?.trim()
      ? category.nameEn
      : category.nameAr;
  }

  // =====================================================
  // CATEGORY IMAGE
  // =====================================================

  getCategoryImage(category: Category): string {

    if (
      !category.imageUrl ||
      category.imageUrl.trim() === ''
    ) {
      return 'assets/images/category-placeholder.jpg';
    }

    return this.api + category.imageUrl;
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
      this.categoryTrack.nativeElement;

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
                !!category
            )
          );

          this.isLoadingCategories.set(false);
        },

        error: (error) => {

          console.error(
            'CATEGORIES ERROR:',
            error
          );

          this.categories.set([]);

          this.isLoadingCategories.set(false);
        }
      });
  }
}