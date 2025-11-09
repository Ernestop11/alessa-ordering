import OrderPageClient, { type OrderMenuSection, type OrderMenuItem } from '@/components/order/OrderPageClient';

// Mock data for testing
const mockSections: OrderMenuSection[] = [
  {
    id: '1',
    name: 'Tacos',
    description: 'Authentic Mexican tacos',
    type: 'FOOD',
    items: [
      {
        id: '1',
        name: 'Carne Asada Taco',
        description: 'Grilled beef with onions and cilantro',
        price: 3.99,
        category: 'Tacos',
        available: true,
        image: 'https://images.unsplash.com/photo-1565299585323-38174c4a6c3a?w=400&q=80',
        gallery: [],
        tags: ['popular', 'spicy'],
      },
      {
        id: '2',
        name: 'Al Pastor Taco',
        description: 'Marinated pork with pineapple',
        price: 3.99,
        category: 'Tacos',
        available: true,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
        gallery: [],
        tags: ['popular'],
      },
      {
        id: '3',
        name: 'Carnitas Taco',
        description: 'Slow-cooked pork',
        price: 3.99,
        category: 'Tacos',
        available: true,
        image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80',
        gallery: [],
        tags: [],
      },
    ],
  },
  {
    id: '2',
    name: 'Burritos',
    description: 'Large burritos with your choice of filling',
    type: 'FOOD',
    items: [
      {
        id: '4',
        name: 'Beef Burrito',
        description: 'Large burrito with beef, rice, beans, and cheese',
        price: 8.99,
        category: 'Burritos',
        available: true,
        image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80',
        gallery: [],
        tags: ['popular'],
      },
      {
        id: '5',
        name: 'Chicken Burrito',
        description: 'Large burrito with chicken, rice, beans, and cheese',
        price: 8.99,
        category: 'Burritos',
        available: true,
        image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80',
        gallery: [],
        tags: [],
      },
    ],
  },
  {
    id: 'bakery',
    name: 'Panadería',
    description: 'Fresh baked goods daily',
    type: 'BAKERY',
    items: [
      {
        id: '8',
        name: 'Conchas',
        description: 'Traditional Mexican sweet bread',
        price: 2.50,
        category: 'Bakery',
        available: true,
        image: 'https://images.unsplash.com/photo-1608031330583-83d9c0c70a43?w=400&q=80',
        gallery: [],
        tags: ['popular', 'fresh'],
      },
      {
        id: '9',
        name: 'Pan Dulce',
        description: 'Assorted sweet breads',
        price: 3.00,
        category: 'Bakery',
        available: true,
        image: 'https://images.unsplash.com/photo-1608039755401-28912c8341d6?w=400&q=80',
        gallery: [],
        tags: ['popular'],
      },
      {
        id: '10',
        name: 'Churros',
        description: 'Crispy fried dough with cinnamon sugar',
        price: 4.50,
        category: 'Bakery',
        available: true,
        image: 'https://images.unsplash.com/photo-1608031330583-83d9c0c70a43?w=400&q=80',
        gallery: [],
        tags: ['special'],
      },
      {
        id: '11',
        name: 'Tres Leches Cake',
        description: 'Traditional three milk cake',
        price: 5.99,
        category: 'Bakery',
        available: true,
        image: 'https://images.unsplash.com/photo-1608031330583-83d9c0c70a43?w=400&q=80',
        gallery: [],
        tags: ['popular'],
      },
    ],
  },
  {
    id: '3',
    name: 'Beverages',
    description: 'Refreshing drinks',
    type: 'BEVERAGE',
    items: [
      {
        id: '6',
        name: 'Horchata',
        description: 'Traditional rice drink with cinnamon',
        price: 2.99,
        category: 'Beverages',
        available: true,
        image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80',
        gallery: [],
        tags: [],
      },
      {
        id: '7',
        name: 'Jamaica',
        description: 'Hibiscus tea',
        price: 2.99,
        category: 'Beverages',
        available: true,
        image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80',
        gallery: [],
        tags: [],
      },
    ],
  },
];

const mockFeaturedItems: OrderMenuItem[] = [
  {
    id: '1',
    name: 'Carne Asada Taco',
    description: 'Grilled beef with onions and cilantro',
    price: 3.99,
    category: 'Tacos',
    available: true,
    image: 'https://images.unsplash.com/photo-1565299585323-38174c4a6c3a?w=400&q=80',
    gallery: [],
    tags: ['popular', 'spicy'],
  },
  {
    id: '4',
    name: 'Beef Burrito',
    description: 'Large burrito with beef, rice, beans, and cheese',
    price: 8.99,
    category: 'Burritos',
    available: true,
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80',
    gallery: [],
    tags: ['popular'],
  },
];

export default function TestOrderPage() {
  return (
    <OrderPageClient 
      sections={mockSections} 
      featuredItems={mockFeaturedItems} 
      tenantSlug="test-tenant"
    />
  );
}

