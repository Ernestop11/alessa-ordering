const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TENANT_SLUG = 'taqueriarosita';

// Taqueria Rosita - Stunning configuration with all features
const settingsData = {
  tagline: 'Authentic Mexican Cuisine Since 1982',
  about: `For over 40 years, Taqueria Rosita has been serving the Napa Valley community with the finest Mexican cuisine. Founded by the Corona Family in 1982, our dedication to quality ingredients and authentic preparation methods has stood the test of time. From our famous super deluxe burritos to our sizzling fajitas, every dish is made with love and tradition. Located in the heart of downtown Napa, we're your neighborhood taqueria where everyone is family.`,
  socialInstagram: 'https://www.instagram.com/taqueria_rosita_napa/',
  socialFacebook: 'https://www.facebook.com/taqueriarositanapa',
  deliveryRadiusMi: 10,
  minimumOrderValue: 15,
  currency: 'USD',
  timeZone: 'America/Los_Angeles',
  isOpen: true,
  templateType: 'restaurant',

  // Bold gradient - Black with red accent
  gradientFrom: '#0a0a0a',
  gradientVia: '#1a1a1a',
  gradientTo: '#0f0f0f',

  // Operating hours - Mon-Sat
  operatingHours: {
    monday: { open: '10:30', close: '20:00', isOpen: true },
    tuesday: { open: '10:30', close: '20:00', isOpen: true },
    wednesday: { open: '10:30', close: '20:00', isOpen: true },
    thursday: { open: '10:30', close: '20:00', isOpen: true },
    friday: { open: '10:30', close: '20:30', isOpen: true },
    saturday: { open: '10:30', close: '20:30', isOpen: true },
    sunday: { open: '00:00', close: '00:00', isOpen: false },
  },

  // Branding configuration - Bold black/red theme
  branding: {
    primaryColor: '#1a1a1a',
    secondaryColor: '#c41e3a',
    accentColor: '#d4af37', // Gold accent
    backgroundColor: '#0a0a0a',
    textColor: '#ffffff',
    headerStyle: 'gradient',
    cardStyle: 'elevated',
    buttonStyle: 'bold',
    fontFamily: 'Inter',
    logoPosition: 'center',
    showTagline: true,
    heroStyle: 'carousel',
    menuLayout: 'grid',
    theme: 'dark',
  },

  // Catering tab config
  cateringTabConfig: {
    enabled: true,
    label: 'Catering',
    icon: 'party',
    description: 'Perfect for any occasion! From small gatherings to large events.',
    modalTagline: 'Let us cater your next event!',
    modalHeading: 'Taqueria Rosita Catering',
    phone: '707-255-9208',
    email: 'catering@taqueriarosita.com',
    minimumGuests: 10,
    leadTimeDays: 2,
  },

  // Frontend UI configuration
  frontendConfig: {
    featuredCarousel: {
      title: 'Customer Favorites',
      subtitle: 'Our most-loved dishes, perfected over 40 years',
      autoplay: true,
      interval: 5000,
    },
    hero: {
      style: 'video-background',
      title: 'TAQUERIA ROSITA',
      subtitle: 'Authentic Mexican Cuisine Since 1982',
      ctaText: 'Order Now',
      showBadge: true,
      badgeText: '40+ Years of Tradition',
    },
    quickInfo: {
      showLocation: true,
      showHours: true,
      showPhone: true,
      showRating: true,
    },
    menuSections: {
      collapsible: false,
      showImages: true,
      showDescriptions: true,
      gridColumns: 2,
    },
    cart: {
      style: 'drawer',
      showItemImages: true,
      showUpsells: true,
    },
    checkout: {
      enableApplePay: true,
      enableGooglePay: true,
      enableTips: true,
      tipPresets: [15, 18, 20, 25],
      defaultTip: 18,
    },
  },

  // Membership/Rewards program
  membershipProgram: {
    enabled: true,
    name: 'Rosita Rewards',
    description: 'Earn points with every order and unlock exclusive rewards!',
    pointsPerDollar: 10,
    tiers: [
      {
        name: 'Amigo',
        minPoints: 0,
        discount: 0,
        perks: ['Birthday reward', 'Exclusive offers'],
      },
      {
        name: 'Compadre',
        minPoints: 500,
        discount: 5,
        perks: ['5% off all orders', 'Early access to specials', 'Free chips & salsa'],
      },
      {
        name: 'Familia',
        minPoints: 1500,
        discount: 10,
        perks: ['10% off all orders', 'Priority catering', 'Free appetizer monthly', 'VIP events'],
      },
    ],
  },

  // Rewards available
  rewards: [
    {
      id: 'free-taco',
      name: 'Free Street Taco',
      description: 'Redeem for any street taco',
      pointsCost: 100,
      type: 'free-item',
      itemId: null,
    },
    {
      id: 'free-chips',
      name: 'Free Chips & Salsa',
      description: 'Fresh chips with house-made salsa',
      pointsCost: 150,
      type: 'free-item',
      itemId: null,
    },
    {
      id: 'free-burrito',
      name: 'Free Regular Burrito',
      description: 'Any regular burrito on the menu',
      pointsCost: 350,
      type: 'free-item',
      itemId: null,
    },
    {
      id: '$5-off',
      name: '$5 Off Your Order',
      description: 'Take $5 off any order of $25+',
      pointsCost: 200,
      type: 'discount',
      discountAmount: 5,
      minOrderAmount: 25,
    },
    {
      id: '$10-off',
      name: '$10 Off Your Order',
      description: 'Take $10 off any order of $40+',
      pointsCost: 400,
      type: 'discount',
      discountAmount: 10,
      minOrderAmount: 40,
    },
  ],

  // Email marketing offers
  emailOffers: [
    {
      id: 'welcome',
      name: 'Welcome Offer',
      subject: 'Welcome to Rosita Rewards! Here\'s 15% off',
      description: 'New member welcome discount',
      discountPercent: 15,
      trigger: 'signup',
      active: true,
    },
    {
      id: 'birthday',
      name: 'Birthday Special',
      subject: 'Happy Birthday from Taqueria Rosita!',
      description: 'Free combo plate on your birthday',
      freeItem: 'Combo Plate',
      trigger: 'birthday',
      active: true,
    },
    {
      id: 'comeback',
      name: 'We Miss You',
      subject: 'It\'s been a while! Here\'s 20% off',
      description: 'Re-engagement offer for inactive customers',
      discountPercent: 20,
      trigger: 'inactive-30-days',
      active: true,
    },
    {
      id: 'weekly-special',
      name: 'Weekly Specials',
      subject: 'This Week at Taqueria Rosita',
      description: 'Weekly featured items and deals',
      trigger: 'scheduled',
      schedule: 'weekly-monday',
      active: true,
    },
  ],

  // Gallery images for rewards/catering pages
  rewardsGallery: [
    '/tenant/taqueriarosita/images/hero/burrito-hero.jpg',
    '/tenant/taqueriarosita/images/hero/tacos-hero.jpg',
    '/tenant/taqueriarosita/images/hero/nachos-hero.jpg',
    '/tenant/taqueriarosita/images/hero/margarita-hero.jpg',
  ],

  cateringGallery: [
    '/tenant/taqueriarosita/images/hero/burrito-hero.jpg',
    '/tenant/taqueriarosita/images/hero/carne-asada-hero.jpg',
    '/tenant/taqueriarosita/images/hero/tacos-hero.jpg',
    '/tenant/taqueriarosita/images/hero/nachos-hero.jpg',
  ],

  // Enabled add-ons/features
  enabledAddOns: [
    'rewards',
    'catering',
    'group-ordering',
    'apple-pay',
    'google-pay',
    'email-marketing',
    'reorder',
    'tips',
    'delivery',
    'pickup',
  ],

  // Template configuration for the order page
  templateConfig: {
    sections: [
      {
        type: 'hero',
        enabled: true,
        position: 1,
        content: {
          style: 'gradient-overlay',
          images: [
            '/tenant/taqueriarosita/images/hero/burrito-hero.jpg',
            '/tenant/taqueriarosita/images/hero/tacos-hero.jpg',
            '/tenant/taqueriarosita/images/hero/carne-asada-hero.jpg',
          ],
          title: 'TAQUERIA ROSITA',
          subtitle: 'Serving Napa Valley Since 1982',
          badge: '40+ Years of Tradition',
          cta: 'Order Now',
        },
      },
      {
        type: 'quickInfo',
        enabled: true,
        position: 2,
        content: {
          showAddress: true,
          showPhone: true,
          showHours: true,
          style: 'compact',
        },
      },
      {
        type: 'featuredCarousel',
        enabled: true,
        position: 3,
        content: {
          title: 'Customer Favorites',
          subtitle: 'Our most-loved dishes',
          showPrices: true,
          autoScroll: true,
        },
      },
      {
        type: 'promoBanner1',
        enabled: true,
        position: 4,
        content: {
          title: 'Catering Available',
          subtitle: 'Let us cater your next event!',
          buttonText: 'Learn More',
          buttonLink: '#catering',
          backgroundColor: '#c41e3a',
          textColor: '#ffffff',
          image: '/tenant/taqueriarosita/images/hero/nachos-hero.jpg',
        },
      },
      {
        type: 'menuSections',
        enabled: true,
        position: 5,
        content: {
          layout: 'grid',
          showImages: true,
          columns: 2,
        },
      },
      {
        type: 'reviewsStrip',
        enabled: true,
        position: 6,
        content: {
          title: 'What Our Customers Say',
          showRating: true,
          reviews: [
            { text: 'Best burritos in Napa!', author: 'Maria G.', rating: 5 },
            { text: 'Been coming here for 20 years. Never disappoints.', author: 'John D.', rating: 5 },
            { text: 'The carne asada is incredible!', author: 'Sarah M.', rating: 5 },
          ],
        },
      },
    ],
    theme: {
      mode: 'dark',
      primaryColor: '#c41e3a',
      secondaryColor: '#d4af37',
      backgroundColor: '#0a0a0a',
      cardBackground: '#1a1a1a',
      textColor: '#ffffff',
      accentColor: '#c41e3a',
      borderRadius: '12px',
      shadow: 'lg',
    },
    animations: {
      enabled: true,
      fadeIn: true,
      slideUp: true,
      parallax: false,
    },
  },
};

async function seedSettings() {
  try {
    console.log('🌮 Starting Taqueria Rosita settings seed...\n');

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: TENANT_SLUG },
      include: { settings: true },
    });

    if (!tenant) {
      console.error(`❌ Tenant "${TENANT_SLUG}" not found`);
      process.exit(1);
    }

    console.log(`✅ Found tenant: ${tenant.name} (ID: ${tenant.id})\n`);

    // Update tenant info
    console.log('📝 Updating tenant information...');
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        contactPhone: '707-255-9208',
        contactEmail: 'info@taqueriarosita.com',
        addressLine1: '1214 Main St',
        city: 'Napa',
        state: 'CA',
        postalCode: '94559',
        country: 'USA',
        customDomain: 'taqueriarosita.alessacloud.com',
        heroTitle: 'TAQUERIA ROSITA',
        heroSubtitle: 'Authentic Mexican Cuisine Since 1982',
        primaryColor: '#1a1a1a',
        secondaryColor: '#c41e3a',
      },
    });
    console.log('✅ Tenant info updated\n');

    // Upsert settings
    console.log('⚙️  Configuring tenant settings...');

    if (tenant.settings) {
      // Update existing settings
      await prisma.tenantSettings.update({
        where: { tenantId: tenant.id },
        data: settingsData,
      });
      console.log('✅ Settings updated\n');
    } else {
      // Create new settings
      await prisma.tenantSettings.create({
        data: {
          tenantId: tenant.id,
          ...settingsData,
        },
      });
      console.log('✅ Settings created\n');
    }

    // Summary
    console.log('🎉 SUCCESS! Taqueria Rosita is now configured with:\n');
    console.log('📱 Features Enabled:');
    settingsData.enabledAddOns.forEach(addon => {
      console.log(`   ✓ ${addon}`);
    });

    console.log('\n🎨 Theme:');
    console.log(`   Primary: ${settingsData.branding.primaryColor} (Rich Black)`);
    console.log(`   Secondary: ${settingsData.branding.secondaryColor} (Cardinal Red)`);
    console.log(`   Accent: ${settingsData.branding.accentColor} (Gold)`);
    console.log(`   Mode: ${settingsData.branding.theme}`);

    console.log('\n🏆 Rewards Program:');
    console.log(`   Name: ${settingsData.membershipProgram.name}`);
    console.log(`   Points per $1: ${settingsData.membershipProgram.pointsPerDollar}`);
    console.log(`   Tiers: ${settingsData.membershipProgram.tiers.map(t => t.name).join(' → ')}`);

    console.log('\n📧 Email Marketing:');
    settingsData.emailOffers.forEach(offer => {
      console.log(`   ✓ ${offer.name} (${offer.trigger})`);
    });

    console.log('\n🍽️  Catering:');
    console.log(`   Enabled: ${settingsData.cateringTabConfig.enabled}`);
    console.log(`   Min Guests: ${settingsData.cateringTabConfig.minimumGuests}`);
    console.log(`   Lead Time: ${settingsData.cateringTabConfig.leadTimeDays} days`);

    console.log('\n✅ Configuration complete!');
    console.log('   Visit: https://taqueriarosita.alessacloud.com/order?tenant=taqueriarosita\n');

  } catch (error) {
    console.error('❌ Error seeding settings:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedSettings();
