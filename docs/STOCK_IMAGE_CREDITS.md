# Stock Image Credits

The application relies on a mix of brand-supplied photography (hero backgrounds) and openly licensed imagery (menu items and upsell bundles). Unsplash assets listed below are free to use under the [Unsplash License](https://unsplash.com/license). If you redistribute or publish outside the app, please retain attribution for the Unsplash photos.

| Usage | URL | Photographer |
| --- | --- | --- |
| Hero – La Poblanita | `public/tenant/lapoblanita/hero.jpg` | Provided by La Poblanita team |
| Hero – Las Reinas | `public/tenant/lasreinas/hero.jpg` | Provided by Las Reinas Taquería |
| Hero – Villa Corona | `public/tenant/villacorona/hero.jpg` | Provided by Villa Corona |
| Carnitas tacos | https://unsplash.com/photos/KsLPTsYaqIQ | `@jeswinthomas` |
| Tacos al pastor | https://unsplash.com/photos/XYFoZtgd4eM | `@cravetheben` |
| Conchas | https://unsplash.com/photos/zumOIKQ4c3E | `@brytonpatterson` |
| Churros | https://unsplash.com/photos/jK9dT34TfuI | `@giuliadicapua` |
| Carnitas plate | https://unsplash.com/photos/QZ6wLR6_JwE | `@mateokolesnik` |
| Birria tacos | https://unsplash.com/photos/tKcdleinyIQ | `@mateusz_feliksik` |
| Carne asada | https://unsplash.com/photos/VcM1hu-2KoM | `@emersonvieira` |
| Salsa flight | https://unsplash.com/photos/FK81rxilUXg | `@heftiba` |
| Chilaquiles | https://unsplash.com/photos/7MG87S9v4Jo | `@4thepeople` |
| Breakfast burrito | https://unsplash.com/photos/fdlZBWIP0aM | `@briewilly` |
| Pan de elote | https://unsplash.com/photos/0JYgd2QuMfw | `@lexsirsa` |
| Empanadas | https://unsplash.com/photos/7iC1i9spaCk | `@foodess` |
| Tortillas | https://unsplash.com/photos/8manzosfxq0 | `@moniqa` |
| Agua fresca | https://unsplash.com/photos/b6zfGOxKU1E | `@taylorkiser` |
| Upsell – Sweet Fiesta | https://unsplash.com/photos/dhZtNlvNE8M | `@giuliadicapua` |
| Upsell – Agua Upgrade | https://unsplash.com/photos/4cL8mhGOJVE | `@taylorkiser` |
| Upsell – Guacamole | https://unsplash.com/photos/7KLa-xLbSXA | `@samewrodl` |
| Upsell – Butcher Cut | https://unsplash.com/photos/IGfIGP5ONV0 | `@josetaylorphoto` |
| Upsell – Cafecito | https://unsplash.com/photos/9VT6w1Ig9W8 | `@danielcgold` |
| Upsell – Mercado Top-off | https://unsplash.com/photos/GLh7QARgjK4 | `@shirinsoliman` |

> **Tip:** Hero and membership imagery now lives directly in `public/tenant/<slug>/`. For menu and upsell photography you can still self-host by downloading the listed photos into `public/stock/` and updating the URLs in `prisma/seed.js` and `lib/menu-imagery.ts`. Run `npm run db:seed` afterwards to refresh the seeded data.

## Customizing Assets

Set `NEXT_PUBLIC_TENANT_ASSET_BASE_URL` to host branded imagery per tenant. When defined, the app will look for `/[slug]/hero.jpg` and `/[slug]/membership.jpg` beneath that base URL. For menu item photography you can still override each item via the admin dashboard or by editing `prisma/seed.js`.
