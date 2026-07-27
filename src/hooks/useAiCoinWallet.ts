import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  AI_COIN_WALLET_QUERY_KEY,
  aiCoinWalletService,
} from "@/services/aiCoinWalletService";

export const useAiCoinWallet = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: AI_COIN_WALLET_QUERY_KEY,
    queryFn: async () => {
      const response = await aiCoinWalletService.getMyAiCoinWallet();
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: 1,
  });
};
