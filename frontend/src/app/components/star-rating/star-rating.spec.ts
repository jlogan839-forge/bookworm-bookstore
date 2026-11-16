import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StarRating } from './star-rating';

describe('StarRating', () => {
  let fixture: ComponentFixture<StarRating>;
  let el: HTMLElement;

  async function render(rating: number | null, count: number | null = null) {
    fixture.componentRef.setInput('rating', rating);
    fixture.componentRef.setInput('count', count);
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StarRating] }).compileComponents();
    fixture = TestBed.createComponent(StarRating);
    el = fixture.nativeElement;
  });

  it('shows the average and review count, with a screen reader label', async () => {
    await render(4.2, 13);
    expect(el.textContent).toContain('4.2 (13 reviews)');
    expect(el.querySelector('.sr-only')!.textContent).toBe('Rated 4.2 out of 5 from 13 reviews');
  });

  it('uses the singular for one review', async () => {
    await render(5, 1);
    expect(el.textContent).toContain('5.0 (1 review)');
  });

  it('fills the stars in proportion to the rating', async () => {
    await render(3);
    const fill = el.querySelector<HTMLElement>('[aria-hidden="true"] span')!;
    expect(fill.style.width).toBe('60%');
    expect(el.querySelector('.sr-only')!.textContent).toBe('Rated 3.0 out of 5');
  });

  it('says when there are no reviews', async () => {
    await render(null, 0);
    expect(el.textContent!.trim()).toBe('No reviews yet');
  });
});
