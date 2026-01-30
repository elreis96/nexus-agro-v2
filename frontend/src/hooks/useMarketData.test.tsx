import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useAnalytics,
  useExecutiveStats,
} from "./useMarketData";
import { apiClient } from "@/lib/api-client";

// Mock API Client
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    getVolatilityAnalysis: vi.fn(),
    getCorrelationAnalysis: vi.fn(),
    getLagAnalysis: vi.fn(),
  },
}));

// Mock Supabase to avoid initialization errors
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useMarketData Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useAnalytics", () => {
    it("should fetch all analytics data successfully", async () => {
      const mockVolatilityData = [
        {
          ano: 2023,
          mes: 1,
          min_boi: 100,
          max_boi: 200,
          min_dolar: 4,
          max_dolar: 5,
        },
      ];

      const mockCorrelationData = [
        { data_fk: "2023-01-01", valor_dolar: 5, valor_jbs: 20 },
      ];

      const mockLagData = [
        { data_preco: "2023-01-01", valor_boi_gordo: 250, chuva_mm: 50 },
      ];

      (apiClient.getVolatilityAnalysis as unknown as vi.Mock).mockResolvedValue(mockVolatilityData);
      (apiClient.getCorrelationAnalysis as unknown as vi.Mock).mockResolvedValue(mockCorrelationData);
      (apiClient.getLagAnalysis as unknown as vi.Mock).mockResolvedValue(mockLagData);

      const { result } = renderHook(() => useAnalytics({ period: "6m" }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(apiClient.getVolatilityAnalysis).toHaveBeenCalled();
      expect(apiClient.getCorrelationAnalysis).toHaveBeenCalled();
      expect(apiClient.getLagAnalysis).toHaveBeenCalled();
      
      expect(result.current.volatilidade).toEqual(mockVolatilityData);
      expect(result.current.correlacao).toEqual(mockCorrelationData);
      expect(result.current.lagChuva.length).toBe(1);
      expect(result.current.lagChuva[0]).toHaveProperty('chuva_mm_lag_60d', 50);
    });

    it("should handle API errors gracefully", async () => {
      (apiClient.getVolatilityAnalysis as unknown as vi.Mock).mockRejectedValue(
        new Error("API Error"),
      );
      (apiClient.getCorrelationAnalysis as unknown as vi.Mock).mockRejectedValue(
        new Error("API Error"),
      );
      (apiClient.getLagAnalysis as unknown as vi.Mock).mockRejectedValue(
        new Error("API Error"),
      );

      const { result } = renderHook(() => useAnalytics({ period: "6m" }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      
      expect(result.current.error).toBeTruthy();
      expect(result.current.volatilidade).toEqual([]);
      expect(result.current.correlacao).toEqual([]);
      expect(result.current.lagChuva).toEqual([]);
    });
  });
});
