import { Routes } from '@angular/router';

import { Home } from './components/baseLayout/home/home';

// Home is loaded eagerly (first paint); every other page is split into its own
// chunk and downloaded on demand (and preloaded in the background).
export const routes: Routes = [
  { path: '', component: Home },
  { path: 'home', component: Home },

  {
    path: 'allBrands',
    loadComponent: () =>
      import('./components/baseLayout/all-brands/all-brands').then(m => m.AllBrands)
  },
  {
    path: 'product/:id',
    loadComponent: () =>
      import('./components/products/product-modal/product-modal.component').then(
        m => m.ProductModalComponent
      )
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./components/products/product-list/product-list.component').then(
        m => m.ProductListComponent
      )
  },
  {
    path: 'footer',
    loadComponent: () =>
      import('./components/shared/footer/footer.component').then(m => m.FooterComponent)
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./components/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./components/checkout/checkout').then(m => m.CheckoutComponent)
  },

  { path: '**', redirectTo: '' }
];
