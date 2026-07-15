export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  dealerPrice?: number;
  dealerOriginalPrice?: number;
  category:
    | "running"
    | "basketball"
    | "football"
    | "training"
    | "lifestyle"
    | "trail"
    | "women";
  image: string;
  images: string[];
  sizes: number[];
  colors: string[];
  description: string;
  rating: number;
  reviews: number;
  stock?: number;
  isTrending?: boolean;
  isNew?: boolean;
  isOffer?: boolean;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Ultraboost 24",
    brand: "suhan",
    price: 32,
    originalPrice: 40,
    category: "running",
    image: "/assets/shoe-runner-1.jpg",
    images: ["/assets/shoe-runner-1.jpg"],
    sizes: [40, 41, 42, 43, 44, 45, 46],
    colors: ["Core Black", "Cloud White", "Grey Six"],
    description:
      "Experience legendary energy return with the Ultraboost 24. Featuring responsive BOOST midsole technology and a Primeknit+ upper that adapts to your foot for the ultimate running experience.",
    rating: 4.8,
    reviews: 2847,
    isTrending: true,
  },
  {
    id: "2",
    name: "Air Jordan Retro High OG",
    brand: "Nike",
    price: 45,
    category: "basketball",
    image: "/assets/shoe-basketball.jpg",
    images: ["/assets/shoe-basketball.jpg"],
    sizes: [40, 41, 42, 43, 44, 45, 46, 47],
    colors: ["Gym Red/Black", "Royal Blue", "Shadow Grey"],
    description:
      "The icon returns. Air Jordan Retro High OG brings back the classic silhouette with premium leather, Nike Air cushioning, and the unmistakable Wings logo. Court-ready or street-ready.",
    rating: 4.9,
    reviews: 5234,
    isTrending: true,
    isNew: true,
  },
  {
    id: "3",
    name: "Suede Classic XXI",
    brand: "Puma",
    price: 22,
    category: "lifestyle",
    image: "/assets/shoe-retro.jpg",
    images: ["/assets/shoe-retro.jpg"],
    sizes: [39, 40, 41, 42, 43, 44, 45],
    colors: ["Royal Blue", "Forest Green", "Black"],
    description:
      "The Puma Suede has been a street-style icon since 1968. This updated edition features the classic suede upper, signature formstrip, and rubber cupsole for all-day comfort.",
    rating: 4.6,
    reviews: 1823,
    isTrending: true,
  },
  {
    id: "4",
    name: "Gel-Kayano 30",
    brand: "ASICS",
    price: 38,
    originalPrice: 45,
    category: "training",
    image: "/assets/shoe-training.jpg",
    images: ["/assets/shoe-training.jpg"],
    sizes: [40, 41, 42, 43, 44, 45],
    colors: ["Safety Yellow", "Black/White", "Blue Coast"],
    description:
      "Stability meets speed. The Gel-Kayano 30 features FF BLAST PLUS cushioning and 4D GUIDANCE SYSTEM for smooth transitions. Built for athletes who demand support without compromise.",
    rating: 4.7,
    reviews: 3156,
    isTrending: true,
    isNew: true,
  },
  {
    id: "5",
    name: "Air Max 97",
    brand: "Nike",
    price: 35,
    category: "lifestyle",
    image: "/assets/shoe-lifestyle.jpg",
    images: ["/assets/shoe-lifestyle.jpg"],
    sizes: [39, 40, 41, 42, 43, 44, 45],
    colors: ["White/Wolf Grey", "Triple Black", "Silver Bullet"],
    description:
      "The Air Max 97 delivers a sleek, fast look with its full-length visible Air unit and reflective design elements. An icon of Air Max innovation.",
    rating: 4.8,
    reviews: 4521,
    isTrending: true,
  },
  {
    id: "6",
    name: "Speedcross 6",
    brand: "Salomon",
    price: 42,
    category: "trail",
    image: "/assets/shoe-trail.jpg",
    images: ["/assets/shoe-trail.jpg"],
    sizes: [40, 41, 42, 43, 44, 45, 46],
    colors: ["Orange/Black", "Blue/Green", "All Black"],
    description:
      "Conquer any terrain with the Speedcross 6. Aggressive Contagrip MA outsole, SensiFit cradle, and Ortholite sockliner make this the ultimate trail running weapon.",
    rating: 4.7,
    reviews: 1967,
    isNew: true,
  },
  {
    id: "7",
    name: "Cloudrunner 2",
    brand: "On",
    price: 36,
    category: "women",
    image: "/assets/shoe-womens-run.jpg",
    images: ["/assets/shoe-womens-run.jpg"],
    sizes: [36, 37, 38, 39, 40, 41, 42],
    colors: ["Hot Pink", "All Black", "Undyed White"],
    description:
      "Run on clouds with On Cloudrunner 2. CloudTec Phase cushioning adapts to your stride, while the Helion HF superfoam delivers explosive energy return. Lightweight performance perfected.",
    rating: 4.8,
    reviews: 2341,
    isTrending: true,
  },
  {
    id: "8",
    name: "Predator Elite FG",
    brand: "Adidas",
    price: 55,
    originalPrice: 65,
    category: "football",
    image: "/assets/shoe-football.jpg",
    images: ["/assets/shoe-football.jpg"],
    sizes: [39, 40, 41, 42, 43, 44, 45, 46],
    colors: ["Core Black/Gold", "Solar Red", "White/Blue"],
    description:
      "Dominate the pitch with Predator Elite. Hybridtouch 2.0 upper delivers enhanced ball control, while the Facetframe outsole provides explosive acceleration and sharp turns.",
    rating: 4.9,
    reviews: 1456,
    isTrending: true,
  },
  {
    id: "9",
    name: "Fresh Foam X 1080v13",
    brand: "New Balance",
    price: 34,
    category: "running",
    image: "/assets/shoe-lifestyle.jpg",
    images: ["/assets/shoe-lifestyle.jpg"],
    sizes: [40, 41, 42, 43, 44, 45],
    colors: ["Grey Matter", "Black/Neon", "Sea Salt"],
    description:
      "Premium comfort meets performance. Fresh Foam X midsole delivers plush cushioning mile after mile, while the Hypoknit upper provides targeted support and breathability.",
    rating: 4.6,
    reviews: 2134,
  },
  {
    id: "10",
    name: "RS-X Reinvention",
    brand: "Puma",
    price: 28,
    originalPrice: 35,
    category: "lifestyle",
    image: "/assets/shoe-retro.jpg",
    images: ["/assets/shoe-retro.jpg"],
    sizes: [39, 40, 41, 42, 43, 44, 45],
    colors: ["Blue/Red", "White/Grey", "Black/Yellow"],
    description:
      "Chunky, bold, and unapologetically loud. The RS-X Reinvention celebrates the 80s Running System technology with modern materials and an exaggerated design.",
    rating: 4.5,
    reviews: 1678,
  },
  {
    id: "11",
    name: "Mercurial Superfly 10",
    brand: "Nike",
    price: 52,
    category: "football",
    image: "/assets/shoe-training.jpg",
    images: ["/assets/shoe-training.jpg"],
    sizes: [39, 40, 41, 42, 43, 44, 45],
    colors: ["Volt/Black", "White/Blue", "Total Orange"],
    description:
      "Speed has a new shape. The Mercurial Superfly 10 features Nike Air Zoom cushioning and a Flyknit upper that wraps your foot for a second-skin feel. Built for the fastest players on the pitch.",
    rating: 4.8,
    reviews: 3789,
    isNew: true,
  },
  {
    id: "12",
    name: "Gel-Nimbus 26",
    brand: "ASICS",
    price: 36,
    category: "women",
    image: "/assets/shoe-womens-run.jpg",
    images: ["/assets/shoe-womens-run.jpg"],
    sizes: [36, 37, 38, 39, 40, 41],
    colors: ["Pink Rave", "Black/Pure Silver", "Cream"],
    description:
      "Maximum cushioning meets maximum comfort. PureGEL technology and FF BLAST PLUS ECO cushioning provide the softest, smoothest ride for long-distance runners.",
    rating: 4.7,
    reviews: 2567,
  },
];

export const categories = [
  { id: "running", name: "Running", count: 48, emoji: "🏃" },
  { id: "basketball", name: "Basketball", count: 35, emoji: "🏀" },
  { id: "football", name: "Football", count: 42, emoji: "⚽" },
  { id: "training", name: "Training", count: 31, emoji: "💪" },
  { id: "lifestyle", name: "Lifestyle", count: 56, emoji: "🔥" },
  { id: "trail", name: "Trail", count: 24, emoji: "🏔️" },
  { id: "women", name: "Women's", count: 38, emoji: "👟" },
] as const;

export const brands = [
  "Nike",
  "Adidas",
  "Puma",
  "ASICS",
  "New Balance",
  "On",
  "Salomon",
] as const;
