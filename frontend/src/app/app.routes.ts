import { Routes } from '@angular/router';
import { Catalog } from './pages/catalog/catalog';
import { BookDetail } from './pages/book-detail/book-detail';
import { Cart } from './pages/cart/cart';
import { Checkout } from './pages/checkout/checkout';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Account } from './pages/account/account';

// Each web address opens one page
export const routes: Routes = [
  { path: '', component: Catalog, title: 'Catalog | Bookworm' },
  { path: 'books/:isbn', component: BookDetail, title: 'Book details | Bookworm' },
  { path: 'cart', component: Cart, title: 'Cart | Bookworm' },
  { path: 'checkout', component: Checkout, title: 'Checkout | Bookworm' },
  { path: 'login', component: Login, title: 'Log in | Bookworm' },
  { path: 'register', component: Register, title: 'Sign up | Bookworm' },
  { path: 'account', component: Account, title: 'Account | Bookworm' },
  { path: '**', redirectTo: '' }, // any unknown address goes to the catalog
];
