"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import StatCard from "./components/StatCard";
import ChurnRateChart from "./components/ChurnRateChart";
import RecentChurnsTable from "./components/RecentChurnsTable";
import ChurnReasonChart from "./components/ChurnReasonChart";
import ImportantFeaturesChart from "./components/ImportantFeaturesChart";
import MonthSelector from "./components/MonthSelector";
import { format } from "date-fns";

// ✅ **MonthlyData Interface**
interface MonthlyData {
  p_mt: number;
  total: number;
  churn: number;
  new: number;
  churn_rate: number;
  high_risk_customers: any[];
  churn_reasons: { [key: string]: number };
}

// ✅ **이전 월 가져오기 함수**
function getPreviousMonth(currentMonth: number): number {
  return currentMonth > 2 ? currentMonth - 1 : 1; // Prevents going below 1
}

// ✅ **트렌드 계산 함수**
function calculateTrend(
  current?: number,
  previous?: number
): { trend: "up" | "down" | undefined; percentage: string } {
  if (!previous || !current || previous === 0) {
    return { trend: undefined, percentage: "0.00" };
  }

  const diff = current - previous;
  return {
    trend: diff > 0 ? "up" : diff < 0 ? "down" : undefined,
    percentage: Math.abs((diff / previous) * 100).toFixed(2),
  };
}

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState<number>(12);
  const [monthlyData, setMonthlyData] = useState<Record<number, MonthlyData>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [churnResponse, highRiskResponse, reasonsResponse] = await Promise.all([
          axios.get(`http://localhost:8000/api/churn_rate?p_mt=${selectedMonth}`),
          axios.get(`http://localhost:8000/api/high_risk_customers?p_mt=${selectedMonth}`),
          axios.get(`http://localhost:8000/api/churn_reasons?p_mt=${selectedMonth}`)
        ]);

        const churnData = churnResponse.data.reduce((acc: Record<number, MonthlyData>, item: any) => {
          acc[item.p_mt] = {
            p_mt: item.p_mt,
            total: item.total_customers,
            churn: item.churn_customers,
            new: item.new_customers,
            churn_rate: parseFloat(((item.churn_customers / item.total_customers) * 100).toFixed(2)),
            high_risk_customers: [],
            churn_reasons: {}
          };
          return acc;
        }, {});

        churnData[selectedMonth] = churnData[selectedMonth] || { high_risk_customers: [], churn_reasons: {} };
        churnData[selectedMonth].high_risk_customers = highRiskResponse.data || [];
        churnData[selectedMonth].churn_reasons = reasonsResponse.data.reduce((acc: Record<string, number>, item: any) => {
          acc[item.reason] = item.percentage;
          return acc;
        }, {});

        setMonthlyData(churnData);
        setLoading(false);
      } catch (error) {
        console.error("🚨 데이터 가져오기 실패:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth]);

  const data = monthlyData[selectedMonth] || {};
  const previousMonth = getPreviousMonth(selectedMonth);
  const previousData = monthlyData[previousMonth] || {};

  // ✅ **트렌드 계산**
  const churnTrend = calculateTrend(data.churn, previousData?.churn);
  const newCustomerTrend = calculateTrend(data.new, previousData?.new);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#53565A]">고객 해지 관리 대시보드</h1>
        <div className="flex items-center space-x-4">
          <MonthSelector onMonthChange={(month) => setSelectedMonth(parseInt(month, 10) || 1)} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="총 고객 수" value={data.total?.toLocaleString() || "-"} />
        <StatCard
          title="해지 고객 수"
          value={data.churn?.toLocaleString() || "-"}
          trend={churnTrend.trend}
          percentage={churnTrend.percentage + "%"}
        />
        <StatCard
          title="신규 고객"
          value={data.new?.toLocaleString() || "-"}
          trend={newCustomerTrend.trend}
          percentage={newCustomerTrend.percentage + "%"}
        />
      </div>

      <ChurnRateChart selectedMonth={selectedMonth} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ImportantFeaturesChart selectedMonth={selectedMonth} /> {/* ✅ 주요 해지 영향 요인 추가 */}
        <ChurnReasonChart selectedMonth={selectedMonth.toString()} />
      </div>

      <RecentChurnsTable 
        customers={data.high_risk_customers || []} 
        referenceDate={format(new Date(), "yyyy-MM-dd")} 
      />
    </div>
  );
}
