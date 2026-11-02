import { Component, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  cart = inject(CartService);

  // Placeholder until login is built
  isLoggedIn = signal(false);

  // FR-13: light/dark mode, remembered between visits
  isDark = signal(false);

  constructor() {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem('theme');
    } catch {}
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.setDark(saved ? saved === 'dark' : prefersDark);
  }

  toggleTheme() {
    this.setDark(!this.isDark());
    try {
      localStorage.setItem('theme', this.isDark() ? 'dark' : 'light');
    } catch {}
  }

  private setDark(dark: boolean) {
    this.isDark.set(dark);
    document.documentElement.classList.toggle('dark', dark);
  }
}
