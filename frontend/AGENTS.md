
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

## API Access (Bookworm convention)

The Flask backend runs locally at `http://localhost:5001/api` (prototype only). Frontend code talks to it through one layer:

- `src/app/api/` holds the base URL (`api.config.ts`) and one types file per backend resource (`book.ts`, `review.ts`, `order.ts`, ...).
  - Types describe the **JSON the API returns** (e.g. `Book.get_details()`), not the database models.
  - If you change a backend response, update the matching `api/*.ts` file in the same PR.
- `src/app/services/` holds one service per backend resource (`BookService`, `ReviewService`, ...), not one per page. Pages inject whichever services they need.
- Services stay thin: build the request, return typed data. No business rules (search matching, stock checks, sorting, etc.); those live in the backend's `services/` layer. Use computed fields like `inStock` instead of re-deriving them.
- Components never use `HttpClient` directly; they go through a service.
- Backend-only services (payments, YouTube, Open Library, AI assistant) get no frontend mirror; their results reach the frontend through an endpoint on an existing resource.
- If the backend is missing something a page needs, prefer adding it to the backend. If you must work around it in the frontend, mark it with a `TODO` explaining what backend change would remove it.
