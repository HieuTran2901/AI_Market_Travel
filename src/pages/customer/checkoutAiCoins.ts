import type { PriceBreakdownDto } from "../../types/payment";

export const DEFAULT_VND_PER_AI_COIN = 1_000;

export type AiCoinBreakdown = {
  subtotal: number;
  extrasAmount: number;
  serviceFee: number;
  tax: number;
  discount: number;
  finalTotal: number;
};

export const convertVndToAiCoins = (amount: number): number =>
  Math.max(0, Math.ceil((Number.isFinite(amount) ? amount : 0) / DEFAULT_VND_PER_AI_COIN));

const resolveCoinAmount = (backendAmount: number | undefined, vndAmount: number): number =>
  typeof backendAmount === "number" && Number.isFinite(backendAmount) && backendAmount >= 0
    ? Math.ceil(backendAmount)
    : convertVndToAiCoins(vndAmount);

export const getAiCoinBreakdown = (
  totals: PriceBreakdownDto | undefined,
  fallbackTotal: number,
): AiCoinBreakdown => ({
  subtotal: resolveCoinAmount(totals?.coinSubtotal, totals?.subtotal ?? fallbackTotal),
  extrasAmount: resolveCoinAmount(totals?.coinExtrasAmount, totals?.extrasAmount ?? 0),
  serviceFee: resolveCoinAmount(totals?.coinServiceFee, totals?.serviceFee ?? 0),
  tax: resolveCoinAmount(totals?.coinTax, totals?.tax ?? 0),
  discount: resolveCoinAmount(totals?.coinDiscount, totals?.discount ?? 0),
  finalTotal: resolveCoinAmount(totals?.coinFinalTotal, totals?.finalTotal ?? fallbackTotal),
});
