import { ReportingRepository } from "../../infrastructure/repositories/reporting.repository";
import { DashboardMetrics, SalesReportItem, InventoryReportItem, SalesChartData } from "../../domain/types";

export class ReportingService {
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    return ReportingRepository.getDashboardMetrics();
  }

  static async getSalesChartData(): Promise<SalesChartData[]> {
    return ReportingRepository.getSalesChartData();
  }

  static async getSalesReport(): Promise<SalesReportItem[]> {
    return ReportingRepository.getSalesReport();
  }

  static async getInventoryReport(): Promise<InventoryReportItem[]> {
    return ReportingRepository.getInventoryReport();
  }
}
