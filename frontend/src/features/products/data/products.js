export const products = [
  {
    id: "EB-001",
    name: "Beauty of Joseon Glow Serum",
    brand: "Beauty of Joseon",
    category: "Serum",
    price: 1650,
    oldPrice: 1950,
    rating: 4.9,
    badge: "BEST SELLER",
    image: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=700&q=85"
  },
  {
    id: "EB-002",
    name: "Hydrating Daily Face Cream",
    brand: "K-Beauty",
    category: "Moisturizer",
    price: 1250,
    oldPrice: 1500,
    rating: 4.8,
    badge: "NEW",
    image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=700&q=85"
  },
  {
    id: "EB-003",
    name: "Gentle Facial Cleanser",
    brand: "Daily Skincare",
    category: "Cleanser",
    price: 890,
    oldPrice: 1150,
    rating: 4.7,
    badge: "POPULAR",
    image: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=700&q=85"
  },
  {
    id: "EB-004",
    name: "Brightening Vitamin C Serum",
    brand: "Glow Essentials",
    category: "Serum",
    price: 1450,
    oldPrice: 1750,
    rating: 4.9,
    badge: "HOT",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=700&q=85"
  },
  {
    id: "EB-005",
    name: "Nourishing Skincare Set",
    brand: "EverythingBD",
    category: "Skincare",
    price: 2150,
    oldPrice: 2650,
    rating: 4.8,
    badge: "NEW",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=700&q=85"
  },
  {
    id: "EB-006",
    name: "Daily Moisturizing Lotion",
    brand: "Skin Ritual",
    category: "Moisturizer",
    price: 990,
    oldPrice: 1290,
    rating: 4.7,
    badge: "SAVE",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=700&q=85"
  }
];

export const categories = [
  { name: "Serum", icon: "✨" },
  { name: "Cleanser", icon: "🫧" },
  { name: "Moisturizer", icon: "🌸" },
  { name: "Sunscreen", icon: "☀️" },
  { name: "Skincare", icon: "🧴" },
  { name: "Hair Care", icon: "��" }
];

export const money = (value) =>
  `৳${Number(value).toLocaleString("en-BD")}`;
