const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const STOCK = {
  hero: {
    lapoblanita: '/tenant/lapoblanita/hero.jpg',
    lasreinas: '/tenant/lasreinas/hero.jpg',
    villacorona: '/tenant/villacorona/hero.jpg',
  },
  membership: {
    lapoblanita: '/tenant/lapoblanita/membership.jpg',
    lasreinas: '/tenant/lasreinas/membership.jpg',
    villacorona: '/tenant/villacorona/membership.jpg',
  },
  menu: {
    carnitas: 'https://images.unsplash.com/photo-1612872087720-bb876e7b8b1d?auto=format&fit=crop&w=1400&q=80',
    pastor: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=1400&q=80',
    conchas: 'https://images.unsplash.com/photo-1542691457-cbe4df041eb2?auto=format&fit=crop&w=1400&q=80',
    churros: 'https://images.unsplash.com/photo-1604908177304-250c58c2e2fb?auto=format&fit=crop&w=1400&q=80',
    carnitasPlate: 'https://images.unsplash.com/photo-1608032362190-1a9ceded7480?auto=format&fit=crop&w=1400&q=80',
    birria: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1400&q=80',
    carneAsada: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1400&q=80',
    salsaRoja: 'https://images.unsplash.com/photo-1529059997568-3bb97f5a4c61?auto=format&fit=crop&w=1400&q=80',
    chilaquiles: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=1400&q=80',
    breakfastBurrito: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80',
    panDeElote: 'https://images.unsplash.com/photo-1483699606544-3ffcf99458d4?auto=format&fit=crop&w=1400&q=80',
    empanadas: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=1400&q=80',
    tortillas: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1400&q=80',
    aguaFresca: 'https://images.unsplash.com/photo-1592329427158-9f28df1b6d37?auto=format&fit=crop&w=1400&q=80',
  },
  upsell: {
    sweetFiesta: 'https://images.unsplash.com/photo-1604908177304-250c58c2e2fb?auto=format&fit=crop&w=1200&q=80',
    aguaUpgrade: 'https://images.unsplash.com/photo-1592329427158-9f28df1b6d37?auto=format&fit=crop&w=1200&q=80',
    guacDuo: 'https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?auto=format&fit=crop&w=1200&q=80',
    butcherCut: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&w=1200&q=80',
    salsaFlight: 'https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?auto=format&fit=crop&w=1200&q=80',
    cafecito: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80',
    mercadoTopoff: 'https://images.unsplash.com/photo-1511689987572-1c1bfb9cfd63?auto=format&fit=crop&w=1200&q=80',
  },
};

async function main() {
  const tenants = [
    {
      name: 'La Poblanita Mexican Food',
      slug: 'lapoblanita',
      domain: 'lapoblanita.alessacloud.com',
      contactEmail: 'orders@lapoblanita.com',
      contactPhone: '(615) 964-7545',
      addressLine1: '5316 Mt View Rd',
      city: 'Antioch',
      state: 'TN',
      postalCode: '37013',
      primaryColor: '#dc2626',
      secondaryColor: '#f97316',
      logoUrl: '/tenant/lapoblanita/logo.png',
      heroTitle: 'Sabores de Puebla',
      heroSubtitle: 'Traditional Mexican flavors from the heart of Puebla',
      heroImageUrl: STOCK.hero.lapoblanita,
      featureFlags: ['restaurant', 'bakery'],
      settings: {
        create: {
          tagline: 'Auténtica Cocina Poblana',
          socialInstagram: '@lapoblanita',
          deliveryRadiusMi: 6,
          minimumOrderValue: 20,
          operatingHours: 'Daily: 7:00 AM – 9:00 PM',
          branding: {
            heroImages: [
              STOCK.hero.lapoblanita,
              STOCK.membership.lapoblanita,
            ],
            location: 'Taqueria La Poblanita\n5316 Mt View Rd\nAntioch, TN 37013',
            hours: 'Daily\n7:00 AM – 9:00 PM',
            highlights: [
              'Authentic Puebla-style recipes',
              'Bakery conchas & pan dulce baked daily',
              'Warm service from our Antioch familia',
            ],
            recommendedItems: ['Carnitas Tacos', 'Cabeza Tacos', 'Chicken Flautas'],
            logo: '/tenant/lapoblanita/logo.png',
          },
          membershipProgram: {
            enabled: true,
            pointsPerDollar: 12,
            heroCopy: 'Puntos frescos en cada pedido — canjéalos por postres, bebidas y drops secretos.',
            featuredMemberName: 'Maria Rodriguez',
            tiers: [
              {
                id: 'bronze',
                name: 'Bronce',
                threshold: 0,
                rewardDescription: 'Bienvenida a la familia',
                perks: ['5% off on weekday lunch', 'Chef tips newsletter'],
                badgeColor: '#f97316',
                sortOrder: 0,
              },
              {
                id: 'gold',
                name: 'Oro',
                threshold: 600,
                rewardDescription: 'Postres gratis cada mes',
                perks: ['Monthly dessert drop', 'Early access to chef specials', 'Free delivery twice a month'],
                badgeColor: '#fbbf24',
                sortOrder: 1,
              },
            ],
          },
          upsellBundles: [
            {
              id: 'sweet-fiesta',
              name: 'Sweet Fiesta Pack',
              description: 'Churros con cajeta, cinnamon sugar, and café de olla sipping sauce.',
              price: 5.99,
              image: STOCK.upsell.sweetFiesta,
              tag: 'Dessert',
              cta: 'Add Sweet Fiesta',
              surfaces: ['cart', 'checkout'],
            },
            {
              id: 'agua-upgrade',
              name: 'Agua Fresca Upgrade',
              description: 'Bump to a 24oz horchata or jamaica for the perfect pairing.',
              price: 3.75,
              image: STOCK.upsell.aguaUpgrade,
              tag: 'Bebida',
              cta: 'Upgrade my drink',
              surfaces: ['cart'],
            },
            {
              id: 'guac-duo',
              name: 'Guacamole Lovers',
              description: 'House guacamole with totopos and salsa macha.',
              price: 4.5,
              image: STOCK.upsell.guacDuo,
              tag: 'Botana',
              cta: 'Add Guac Duo',
              surfaces: ['cart', 'menu'],
            },
          ],
          accessibilityDefaults: {
            highContrast: false,
            largeText: false,
            reducedMotion: false,
          },
        },
      },
      integrations: {
        create: {
          doorDashStoreId: 'demo-lapoblanita',
          cloverMerchantId: 'demo-clover-lapoblanita',
          squareLocationId: 'demo-square-lapoblanita',
          applePayMerchantId: 'merchant.com.lapoblanita',
          platformPercentFee: 0.029,
          platformFlatFee: 0.3,
          defaultTaxRate: 0.0825,
          deliveryBaseFee: 4.99,
        },
      },
      sections: [
        {
          name: 'Taqueria Favorites',
          type: 'RESTAURANT',
          description: 'Classic tacos and plates from the taqueria line',
          position: 0,
          items: [
            {
              name: 'Carnitas Tacos',
              description: 'Slow-cooked pork shoulder with onions, cilantro, and salsa verde',
              price: 12.99,
              category: 'tacos',
              image: STOCK.menu.carnitas,
              tags: ['taqueria', 'popular'],
            },
            {
              name: 'Cabeza Tacos',
              description: 'Tender beef head tacos with onions, cilantro, and salsa roja',
              price: 13.49,
              category: 'tacos',
              image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=1400&q=80',
              tags: ['taqueria', 'recommended'],
            },
            {
              name: 'Chicken Flautas',
              description: 'Crispy rolled tortillas filled with shredded chicken, crema, and queso fresco',
              price: 11.99,
              category: 'plates',
              image: 'https://images.unsplash.com/photo-1608032362190-1a9ceded7480?auto=format&fit=crop&w=1400&q=80',
              tags: ['taqueria', 'recommended'],
            },
          ],
        },
        {
          name: 'Panadería',
          type: 'BAKERY',
          description: 'Pan dulce baked fresh every morning',
          position: 1,
          items: [
            {
              name: 'Conchas Tradicionales',
              description: 'Sweet bread with vanilla or chocolate shell topping',
              price: 2.99,
              category: 'bakery',
              image: STOCK.menu.conchas,
              tags: ['bakery'],
            },
            {
              name: 'Churros con Cajeta',
              description: 'Fresh churros with warm cajeta dipping sauce',
              price: 7.99,
              category: 'bakery',
              image: STOCK.menu.churros,
              tags: ['bakery', 'dessert'],
            },
          ],
        },
      ],
    },
    {
      name: 'Las Reinas Taqueria y Carniceria',
      slug: 'lasreinas',
      domain: 'lasreinas.alessacloud.com',
      contactEmail: 'hola@lasreinas.com',
      contactPhone: '(555) 234-5678',
      addressLine1: '1685 Gallatin Pike N',
      city: 'Madison',
      state: 'TN',
      postalCode: '37115',
      primaryColor: '#047857',
      secondaryColor: '#fbbf24',
      logoUrl: '/tenant/lasreinas/logo.png',
      heroTitle: 'Reinas de la Taquería',
      heroSubtitle: 'From the butcher block to your plate',
      heroImageUrl: STOCK.hero.lasreinas,
      featureFlags: ['restaurant', 'grocery'],
      settings: {
        create: {
          tagline: 'Taquería y Carnicería',
          socialInstagram: '@lasreinastaqueria',
          deliveryRadiusMi: 8,
          minimumOrderValue: 25,
          branding: {
            heroImages: [STOCK.hero.lasreinas, STOCK.membership.lasreinas],
            location: 'Las Reinas Taqueria y Carniceria\n1685 Gallatin Pike N\nMadison, TN 37115',
            hours: 'Daily\n9:00 AM – 9:00 PM',
            highlights: [
              'Full-service carnicería with house marinades',
              'Family recipes from Guadalajara every weekend',
              'Freshly nixtamalized tortillas pressed hourly',
            ],
            recommendedItems: ['Carnitas Plate', 'Birria Tacos', 'Carne Asada (1 lb)'],
            logo: '/tenant/lasreinas/logo.png',
          },
          membershipProgram: {
            enabled: true,
            pointsPerDollar: 8,
            heroCopy: 'Earn cuts, salsas, and weekend specials just for stopping by.',
            featuredMemberName: 'Chef Ana',
            tiers: [
              {
                id: 'amigos',
                name: 'Amigos',
                threshold: 0,
                rewardDescription: 'Weekly butcher picks',
                perks: ['Earn points on every order', 'Exclusive SMS drops'],
                badgeColor: '#047857',
                sortOrder: 0,
              },
              {
                id: 'reina',
                name: 'Reina',
                threshold: 750,
                rewardDescription: 'Private tasting invites',
                perks: ['Priority catering slots', 'Birthday parrillada kit'],
                badgeColor: '#facc15',
                sortOrder: 1,
              },
            ],
          },
          upsellBundles: [
            {
              id: 'butcher-cut',
              name: 'Butcher Cut Add-on',
              description: 'Add a half-pound of marinated carne asada to your order.',
              price: 7.5,
              image: STOCK.upsell.butcherCut,
              tag: 'Carnicería',
              cta: 'Add butcher cut',
              surfaces: ['cart', 'checkout'],
            },
            {
              id: 'salsa-flight',
              name: 'Salsa Flight',
              description: 'Roja, verde, and macha trio for $3.99.',
              price: 3.99,
              image: STOCK.upsell.salsaFlight,
              tag: 'Salsa',
              cta: 'Add salsa flight',
              surfaces: ['cart'],
            },
          ],
          accessibilityDefaults: {
            highContrast: false,
            largeText: true,
            reducedMotion: false,
          },
        },
      },
      integrations: {
        create: {
          doorDashStoreId: 'demo-lasreinas',
          squareLocationId: 'demo-square-lasreinas',
          printerType: 'bluetooth',
          platformPercentFee: 0.029,
          platformFlatFee: 0.3,
          defaultTaxRate: 0.0825,
          deliveryBaseFee: 5.99,
        },
      },
      sections: [
        {
          name: 'Carnitas y Más',
          type: 'RESTAURANT',
          description: 'Plates from the taqueria line',
          position: 0,
          items: [
            {
              name: 'Carnitas Plate',
              description: 'Carnitas served with beans, rice, and handmade tortillas',
              price: 15.99,
              category: 'plates',
              image: STOCK.menu.carnitasPlate,
              tags: ['taqueria'],
            },
            {
              name: 'Birria Tacos',
              description: 'Crispy birria tacos served with consommé',
              price: 16.49,
              category: 'tacos',
              image: STOCK.menu.birria,
              tags: ['taqueria', 'special'],
            },
          ],
        },
        {
          name: 'Carnicería Grocery',
          type: 'GROCERY',
          description: 'Meats and grocery staples from the carnicería',
          position: 1,
          items: [
            {
              name: 'Carne Asada (1 lb)',
              description: 'Seasoned skirt steak ready for the grill',
              price: 11.99,
              category: 'grocery',
              image: STOCK.menu.carneAsada,
              tags: ['grocery', 'butcher'],
            },
            {
              name: 'Homemade Salsa Roja (16oz)',
              description: 'House-made roja salsa perfect for tacos and chips',
              price: 6.5,
              category: 'grocery',
              image: STOCK.menu.salsaRoja,
              tags: ['grocery', 'salsa'],
            },
          ],
        },
      ],
    },
    {
      name: 'Villa Corona',
      slug: 'villacorona',
      domain: 'villacorona.alessacloud.com',
      contactEmail: 'orders@villacorona.com',
      contactPhone: '(555) 345-6789',
      addressLine1: '3955 Nolensville Pike',
      city: 'Nashville',
      state: 'TN',
      postalCode: '37211',
      primaryColor: '#1d4ed8',
      secondaryColor: '#f97316',
      logoUrl: '/tenant/villacorona/logo.png',
      heroTitle: 'Sabores de Familia',
      heroSubtitle: 'Family recipes from Jalisco to your table',
      heroImageUrl: STOCK.hero.villacorona,
      featureFlags: ['restaurant', 'bakery', 'grocery'],
      settings: {
        create: {
          tagline: 'Taquería • Panadería • Mercado',
          socialInstagram: '@villacorona',
          socialFacebook: 'facebook.com/villacorona',
          deliveryRadiusMi: 10,
          minimumOrderValue: 18,
          branding: {
            heroImages: [STOCK.hero.villacorona, STOCK.membership.villacorona],
            location: 'Villa Corona\n3955 Nolensville Pike\nNashville, TN 37211',
            hours: 'Daily\n6:30 AM – 8:00 PM',
            highlights: [
              'Sunrise breakfast burritos with house chorizo',
              'Panadería case filled with bolillos and conchas',
              'Mercado grab-and-go salsas and aguas frescas',
            ],
            recommendedItems: ['Chilaquiles Verdes', 'Breakfast Burrito', 'Pan de Elote'],
            logo: '/tenant/villacorona/logo.png',
          },
          membershipProgram: {
            enabled: true,
            pointsPerDollar: 10,
            heroCopy: 'Familia points for breakfast burritos, pan dulce, and mercado essentials.',
            featuredMemberName: 'Familia Corona',
            tiers: [
              {
                id: 'familia',
                name: 'Familia',
                threshold: 0,
                rewardDescription: 'Welcome cafecito on us',
                perks: ['10% off weekday breakfast', 'Monthly recipe cards'],
                badgeColor: '#2563eb',
                sortOrder: 0,
              },
              {
                id: 'legado',
                name: 'Legado',
                threshold: 900,
                rewardDescription: 'Seasonal tamal kits and private tastings',
                perks: ['Free delivery weekends', 'Holiday dessert tasting', 'Merch drops first access'],
                badgeColor: '#f97316',
                sortOrder: 1,
              },
            ],
          },
          upsellBundles: [
            {
              id: 'cafecito',
              name: 'Cafecito Combo',
              description: 'Pan dulce trio with café de olla upgrade.',
              price: 6.25,
              image: STOCK.upsell.cafecito,
              tag: 'Panadería',
              cta: 'Add cafecito combo',
              surfaces: ['cart', 'menu'],
            },
            {
              id: 'mercado-topoff',
              name: 'Mercado Top-off',
              description: 'Add house-made salsa roja and tortillas for later.',
              price: 4.75,
              image: STOCK.upsell.mercadoTopoff,
              tag: 'Mercado',
              cta: 'Add mercado bundle',
              surfaces: ['cart'],
            },
          ],
          accessibilityDefaults: {
            highContrast: false,
            largeText: false,
            reducedMotion: true,
          },
        },
      },
      integrations: {
        create: {
          doorDashStoreId: 'demo-villacorona',
          cloverMerchantId: 'demo-clover-villacorona',
          squareLocationId: 'demo-square-villacorona',
          applePayMerchantId: 'merchant.com.villacorona',
          platformPercentFee: 0.029,
          platformFlatFee: 0.3,
          defaultTaxRate: 0.08,
          deliveryBaseFee: 4.49,
        },
      },
      sections: [
        {
          name: 'Favorites from the Kitchen',
          type: 'RESTAURANT',
          description: 'Breakfast and lunch favorites',
          position: 0,
          items: [
            {
              name: 'Chilaquiles Verdes',
              description: 'Crispy tortillas, salsa verde, crema, queso fresco',
              price: 13.5,
              category: 'breakfast',
              image: STOCK.menu.chilaquiles,
              tags: ['taqueria', 'breakfast'],
            },
            {
              name: 'Breakfast Burrito',
              description: 'Scrambled eggs, potatoes, cheese, choice of meat',
              price: 11.99,
              category: 'breakfast',
              image: STOCK.menu.breakfastBurrito,
              tags: ['taqueria', 'popular'],
            },
          ],
        },
        {
          name: 'Panadería Dulce',
          type: 'BAKERY',
          description: 'Pan dulce and sweet treats baked daily',
          position: 1,
          items: [
            {
              name: 'Pan de Elote',
              description: 'Sweet Mexican corn bread loaf',
              price: 5.99,
              category: 'bakery',
              image: STOCK.menu.panDeElote,
              tags: ['bakery'],
            },
            {
              name: 'Empanadas de Calabaza',
              description: 'Pumpkin-filled pastries with cinnamon sugar',
              price: 4.25,
              category: 'bakery',
              image: STOCK.menu.empanadas,
              tags: ['bakery', 'seasonal'],
            },
          ],
        },
        {
          name: 'Mercado Essentials',
          type: 'GROCERY',
          description: 'Groceries and beverages from our mercado',
          position: 2,
          items: [
            {
              name: 'Fresh Tortilla Pack (20ct)',
              description: 'Handmade corn tortillas, 20 count',
              price: 3.99,
              category: 'grocery',
              image: STOCK.menu.tortillas,
              tags: ['grocery'],
            },
            {
              name: 'Agua Fresca de Horchata (32oz)',
              description: 'House horchata with cinnamon and vanilla',
              price: 7.99,
              category: 'beverages',
              image: STOCK.menu.aguaFresca,
              tags: ['beverage'],
            },
          ],
        },
      ],
    },
  ]

  for (const tenant of tenants) {
    try {
      const { sections, settings, integrations, ...tenantData } = tenant
      const createdTenant = await prisma.tenant.create({
        data: {
          ...tenantData,
          settings,
          integrations,
        },
      })
      console.log(`Created tenant ${createdTenant.name}`)

      for (const [index, section] of sections.entries()) {
        const { items, ...sectionData } = section
        const createdSection = await prisma.menuSection.create({
          data: {
            ...sectionData,
            position: sectionData.position ?? index,
            tenantId: createdTenant.id,
          },
        })
        console.log(`  Added section ${createdSection.name}`)

        for (const item of items) {
          await prisma.menuItem.create({
            data: {
              ...item,
              tenantId: createdTenant.id,
              menuSectionId: createdSection.id,
            },
          })
          console.log(`    Added item ${item.name}`)
        }
      }
    } catch (e) {
      console.error('Error creating tenant data', tenant.name, e.message)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
