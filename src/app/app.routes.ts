import { Routes } from '@angular/router';
import { ProductListComponent } from './components/product-list/product-list.component';
import { CartComponent } from './components/cart/cart.component';
import { Checkout } from './components/checkout/checkout';

import { AllBrands } from './components/all-brands/all-brands';
import { Home } from './components/baseLayout/home/home';
import { FooterComponent } from './components/shared/footer/footer.component';

export const routes: Routes = [
  { path: '', component: Home },
    { path: 'home', component: Home },
    { path: 'brand', component: AllBrands },

  { path: 'products', component: ProductListComponent },
  { path: 'footer', component: FooterComponent },
  { path: 'cart', component: CartComponent },
    { path: 'checkout', component: Checkout },

  { path: '**', redirectTo: '' }
];
