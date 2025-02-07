"use client";
import { useState } from "react";
import CustomerTable from "../components/CustomerTable";
import StatCard from "../components/StatCard";
import { useMonthlyStats } from "../hooks/useMonthlyStats";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CustomerSearch() {
  const [selectedMonth, setSelectedMonth] = useState(2); // 기본값: 2월
  const { stats } = useMonthlyStats(selectedMonth);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-6 text-[#53565A]">고객 조회</h1>

      {/* 월 선택 필터 */}
      <div className="flex justify-end">
        <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="월 선택" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 11 }, (_, i) => i + 2).map((month) => (
              <SelectItem key={month} value={month.toString()}>
                {month}월
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
