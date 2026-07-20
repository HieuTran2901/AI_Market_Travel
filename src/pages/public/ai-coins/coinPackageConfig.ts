import {
  adventurePackImage,
  dailyCoinPassImage,
  elitePackImage,
  explorerPackImage,
  galaxyPackImage,
  megaPackImage,
  proPackImage,
  starterPackImage,
  travelerPackImage,
  ultimatePackImage,
} from "./coinPackageAssets";

export type AiCoinPackage = {
  id: string;
  name: string;
  coins: number;
  bonusCoins: number;
  price: number;
  originalPrice?: number | null;
  currency: "VND";
  badge?: string | null;
  image: string;
  featured: boolean;
  active: boolean;
  sortOrder: number;
  packageType: "ONE_TIME" | "DAILY_PASS";
  comingSoon?: boolean;
};

// Temporary frontend package catalog until a trusted AI Coins package API exists.
// Purchase actions do not mutate balances or trust these prices for payment.
export const primaryCoinPackages: AiCoinPackage[] = [
  {
    id: "starter",
    name: "Starter Pack",
    image: starterPackImage,
    coins: 200,
    bonusCoins: 20,
    price: 29000,
    originalPrice: null,
    currency: "VND",
    badge: "+10%",
    featured: false,
    active: true,
    sortOrder: 1,
    packageType: "ONE_TIME",
  },
  {
    id: "explorer",
    name: "Explorer Pack",
    image: explorerPackImage,
    coins: 500,
    bonusCoins: 75,
    price: 59000,
    originalPrice: null,
    currency: "VND",
    badge: "+15%",
    featured: false,
    active: true,
    sortOrder: 2,
    packageType: "ONE_TIME",
  },
  {
    id: "traveler",
    name: "Traveler Pack",
    image: travelerPackImage,
    coins: 1000,
    bonusCoins: 200,
    price: 99000,
    originalPrice: null,
    currency: "VND",
    badge: "+20%",
    featured: false,
    active: true,
    sortOrder: 3,
    packageType: "ONE_TIME",
  },
  {
    id: "adventure",
    name: "Adventure Pack",
    image: adventurePackImage,
    coins: 2500,
    bonusCoins: 500,
    price: 249000,
    originalPrice: 299000,
    currency: "VND",
    badge: "BEST VALUE",
    featured: true,
    active: true,
    sortOrder: 4,
    packageType: "ONE_TIME",
  },
  {
    id: "pro",
    name: "Pro Pack",
    image: proPackImage,
    coins: 5000,
    bonusCoins: 1250,
    price: 449000,
    originalPrice: 599000,
    currency: "VND",
    badge: "+25%",
    featured: false,
    active: true,
    sortOrder: 5,
    packageType: "ONE_TIME",
  },
  {
    id: "elite",
    name: "Elite Pack",
    image: elitePackImage,
    coins: 10000,
    bonusCoins: 3000,
    price: 799000,
    originalPrice: 1099000,
    currency: "VND",
    badge: "+30%",
    featured: false,
    active: true,
    sortOrder: 6,
    packageType: "ONE_TIME",
  },
];

export const largeCoinPackages: AiCoinPackage[] = [
  {
    id: "mega",
    name: "Mega Pack",
    image: megaPackImage,
    coins: 20000,
    bonusCoins: 6000,
    price: 1399000,
    originalPrice: 1999000,
    currency: "VND",
    badge: null,
    featured: false,
    active: true,
    sortOrder: 7,
    packageType: "ONE_TIME",
  },
  {
    id: "ultimate",
    name: "Ultimate Pack",
    image: ultimatePackImage,
    coins: 50000,
    bonusCoins: 17500,
    price: 2999000,
    originalPrice: 4499000,
    currency: "VND",
    badge: null,
    featured: false,
    active: true,
    sortOrder: 8,
    packageType: "ONE_TIME",
  },
  {
    id: "galaxy",
    name: "Galaxy Pack",
    image: galaxyPackImage,
    coins: 100000,
    bonusCoins: 40000,
    price: 5999000,
    originalPrice: 8999000,
    currency: "VND",
    badge: "+40%",
    featured: false,
    active: true,
    sortOrder: 9,
    packageType: "ONE_TIME",
  },
];

export const dailyCoinPassPackage: AiCoinPackage = {
  id: "daily-pass",
  name: "Daily Coin Pass",
  image: dailyCoinPassImage,
  coins: 3000,
  bonusCoins: 0,
  price: 90000,
  originalPrice: null,
  currency: "VND",
  badge: "HOT",
  featured: true,
  active: true,
  sortOrder: 10,
  packageType: "DAILY_PASS",
  comingSoon: true,
};
