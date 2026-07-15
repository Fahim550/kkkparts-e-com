import { useQuery } from "@tanstack/react-query";
import { ReportingService } from "../../application/services/reporting.service";

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ["reporting-dashboard-metrics"],
    queryFn: ReportingService.getDashboardMetrics,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

export const useSalesChartData = () => {
  return useQuery({
    queryKey: ["reporting-sales-chart"],
    queryFn: ReportingService.getSalesChartData,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSalesReport = () => {
  return useQuery({
    queryKey: ["reporting-sales-report"],
    queryFn: ReportingService.getSalesReport,
  });
};

export const useInventoryReport = () => {
  return useQuery({
    queryKey: ["reporting-inventory-report"],
    queryFn: ReportingService.getInventoryReport,
  });
};
