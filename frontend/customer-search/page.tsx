"use client";
import CustomerTable from "../components/CustomerTable";
import StatCard from "../components/StatCard";
import { useMonthlyStats } from "../hooks/useMonthlyStats";

export default function CustomerSearch() {
  // 최신 월별 데이터만 불러옵니다.
  const { stats } = useMonthlyStats();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-6 text-[#53565A]">고객 조회</h1>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="총 고객 수" value={stats.total.formatted} trend={stats.total.trend} />
          <StatCard 
            title="해지 고객 수" 
            value={stats.churn.formatted} 
            trend={stats.churn.trend} 
            percentage={stats.churn.percentage + "%"} 
          />
          <StatCard 
            title="신규 고객" 
            value={stats.new.formatted} 
            trend={stats.new.trend} 
            percentage={stats.new.percentage + "%"} 
          />
        </div>
      )}

      <CustomerTable />
    </div>
  );
}
