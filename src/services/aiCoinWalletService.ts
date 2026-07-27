import api from "./api";
import type { ApiResponse, PageResponse } from "@/types";

export const AI_COIN_WALLET_QUERY_KEY = ["ai-coins", "wallet"] as const;
export const AI_COIN_TRANSACTIONS_QUERY_KEY = ["ai-coins", "transactions"] as const;

export interface AiCoinWallet {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  updatedAt?: string;
}

export interface AiCoinTransaction {
  id: number;
  type: "PURCHASE" | "BONUS" | "SPEND" | "REFUND" | "ADMIN_ADJUSTMENT" | "PROMOTION" | "REVERSAL";
  direction: "CREDIT" | "DEBIT";
  amount: number;
  balanceAfter: number;
  reference?: string;
  description?: string;
  createdAt?: string;
}

export const aiCoinWalletService = {
  async getMyAiCoinWallet(): Promise<ApiResponse<AiCoinWallet>> {
    const response = await api.get<ApiResponse<AiCoinWallet>>("/ai-coins/wallet");
    return response.data;
  },

  async getMyAiCoinTransactions(params?: {
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PageResponse<AiCoinTransaction>>> {
    const response = await api.get<ApiResponse<PageResponse<AiCoinTransaction>>>(
      "/ai-coins/transactions",
      { params },
    );
    return response.data;
  },
};
