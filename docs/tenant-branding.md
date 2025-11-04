# Tenant Branding Checklist

For each tenant, supply the following assets/copy:

- Logo: `public/tenant/<slug>/logo.png` (transparent PNG, 256x256 preferred).
- Hero image: `public/tenant/<slug>/hero.jpg` sized 1600x900 with restaurant imagery.
- Membership image: `public/tenant/<slug>/membership.jpg` for loyalty promos.
- Color palette: configure `primaryColor`, `secondaryColor` via admin settings.
- Hero text: `heroTitle`, `heroSubtitle` describing the restaurant.
- Contact footer: phone, email, address, social handles.
- Menu descriptions per section (avoid placeholder text like “Panadería”).

Keep any source/original files under `assets/tenant/<slug>` and copy the final exported versions into `public/tenant/<slug>` for Next.js to serve. Update seed data or the admin UI with these assets per tenant.
