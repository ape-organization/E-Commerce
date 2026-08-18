import { Routes } from '@angular/router';
import { ProductListComponent } from './components/product-list/product-list.component';
import { CartComponent } from './components/cart/cart.component';
import { FooterComponent } from './components/footer/footer.component';
import { Checkout } from './components/checkout/checkout';

export const routes: Routes = [
  { path: '', component: ProductListComponent },
  { path: 'products', component: ProductListComponent },
  { path: 'footer', component: FooterComponent },
  { path: 'cart', component: CartComponent },
    { path: 'checkout', component: Checkout },

  { path: '**', redirectTo: '' }
];
