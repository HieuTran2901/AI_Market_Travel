import viettelCard from "../../../assets/rewards/mobile-top-up/01-viettel-card.png";
import mobifoneCard from "../../../assets/rewards/mobile-top-up/02-mobifone-card.png";
import vinaphoneCard from "../../../assets/rewards/mobile-top-up/03-vinaphone-card.png";
import garenaCard from "../../../assets/rewards/game-cards/04-garena-card.png";
import zingCard from "../../../assets/rewards/game-cards/05-zing-card.png";
import vcoinCard from "../../../assets/rewards/game-cards/06-vcoin-card.png";
import gateCard from "../../../assets/rewards/game-cards/07-gate-card.png";
import shopeeVoucher from "../../../assets/rewards/vouchers/08-shopee-voucher.png";
import tikiVoucher from "../../../assets/rewards/vouchers/09-tiki-voucher.png";
import grabVoucher from "../../../assets/rewards/vouchers/10-grab-voucher.png";
import bluetoothHeadphones from "../../../assets/rewards/physical-rewards/11-bluetooth-headphones.png";
import miniBluetoothSpeaker from "../../../assets/rewards/physical-rewards/12-mini-bluetooth-speaker.png";
import thermalTravelBottle from "../../../assets/rewards/physical-rewards/13-thermal-travel-bottle.png";
import travelBackpack from "../../../assets/rewards/physical-rewards/14-travel-backpack.png";
import travelKeychain from "../../../assets/rewards/physical-rewards/15-travel-keychain.png";

export type RewardCategory =
  | "all"
  | "mobile-top-up"
  | "game-cards"
  | "vouchers"
  | "tech-gifts"
  | "travel-gifts"
  | "services";

export type RewardVisual = "mobile" | "game" | "voucher" | "tech" | "travel";

export type RewardItem = {
  id: string;
  name: string;
  category: Exclude<RewardCategory, "all">;
  image: string;
  imageAlt: string;
  displayValue?: string;
  price: number;
  badge?: "Hot";
  visual: RewardVisual;
};

export type RewardWalletSummary = {
  goldCoins: number;
  specialCoins: number;
  expiringCoins: number;
};

export type RedemptionHistoryItem = {
  id: string;
  reward: string;
  cost: number;
  status: "Pending" | "Processing" | "Completed" | "Cancelled";
  redeemedAt: string;
};

// TODO: Replace this isolated display data with wallet and reward APIs.
export const demoRewardWallet: RewardWalletSummary = {
  goldCoins: 12_560,
  specialCoins: 12_560,
  expiringCoins: 360,
};

export const rewardItems: RewardItem[] = [
  { id: "viettel-100k", name: "Viettel Mobile Top-Up", category: "mobile-top-up", image: viettelCard, imageAlt: "Viettel mobile top-up card worth 100,000 VND", displayValue: "100,000 VND", price: 3000, badge: "Hot", visual: "mobile" },
  { id: "mobifone-100k", name: "Mobifone Mobile Top-Up", category: "mobile-top-up", image: mobifoneCard, imageAlt: "Mobifone mobile top-up card worth 100,000 VND", displayValue: "100,000 VND", price: 3000, visual: "mobile" },
  { id: "vinaphone-100k", name: "Vinaphone Mobile Top-Up", category: "mobile-top-up", image: vinaphoneCard, imageAlt: "Vinaphone mobile top-up card worth 100,000 VND", displayValue: "100,000 VND", price: 3000, visual: "mobile" },
  { id: "garena-card", name: "Garena Game Card", category: "game-cards", image: garenaCard, imageAlt: "Garena game card worth 100,000 VND", displayValue: "100,000 VND", price: 4500, badge: "Hot", visual: "game" },
  { id: "zing-card", name: "Zing Game Card", category: "game-cards", image: zingCard, imageAlt: "Zing game card worth 100,000 VND", displayValue: "100,000 VND", price: 4500, visual: "game" },
  { id: "vcoin-card", name: "Vcoin Game Card", category: "game-cards", image: vcoinCard, imageAlt: "Vcoin game card worth 100,000 VND", displayValue: "100,000 VND", price: 4500, visual: "game" },
  { id: "gate-card", name: "Gate Game Card", category: "game-cards", image: gateCard, imageAlt: "Gate game card worth 100,000 VND", displayValue: "100,000 VND", price: 4500, visual: "game" },
  { id: "shopee-voucher", name: "Shopee Voucher", category: "vouchers", image: shopeeVoucher, imageAlt: "Shopee voucher worth 100,000 VND", displayValue: "100,000 VND", price: 3500, visual: "voucher" },
  { id: "tiki-voucher", name: "Tiki Voucher", category: "vouchers", image: tikiVoucher, imageAlt: "Tiki voucher worth 100,000 VND", displayValue: "100,000 VND", price: 3500, visual: "voucher" },
  { id: "grab-voucher", name: "Grab Voucher", category: "vouchers", image: grabVoucher, imageAlt: "Grab voucher worth 100,000 VND", displayValue: "100,000 VND", price: 3500, visual: "voucher" },
  { id: "bluetooth-headphones", name: "Bluetooth Headphones", category: "tech-gifts", image: bluetoothHeadphones, imageAlt: "Bluetooth travel headphones", price: 12000, visual: "tech" },
  { id: "bluetooth-speaker", name: "Mini Bluetooth Speaker", category: "tech-gifts", image: miniBluetoothSpeaker, imageAlt: "Mini Bluetooth speaker", price: 8000, visual: "tech" },
  { id: "thermal-bottle", name: "Thermal Travel Bottle", category: "travel-gifts", image: thermalTravelBottle, imageAlt: "Thermal travel bottle", price: 6000, visual: "travel" },
  { id: "travel-backpack", name: "Travel Backpack", category: "travel-gifts", image: travelBackpack, imageAlt: "Travel backpack", price: 15000, visual: "travel" },
  { id: "travel-keychain", name: "Travel Keychain", category: "travel-gifts", image: travelKeychain, imageAlt: "Airplane and globe travel keychain", price: 2500, visual: "travel" },
];

export const demoRedemptionHistory: RedemptionHistoryItem[] = [
  { id: "history-1", reward: "Shopee Voucher", cost: 3500, status: "Completed", redeemedAt: "Jun 18, 2026" },
  { id: "history-2", reward: "Viettel Mobile Top-Up", cost: 3000, status: "Processing", redeemedAt: "Jun 09, 2026" },
  { id: "history-3", reward: "Travel Keychain", cost: 2500, status: "Pending", redeemedAt: "May 27, 2026" },
];
