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

// ✅ **이전 월 가져오기 함수**
function getPreviousMonth(currentMonth: number): number {
  return currentMonth > 1 ? currentMonth - 1 : 12; // ✅ 1월이면 12월로 롤백
}

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState<number>(12);
  const [monthlyData, setMonthlyData] = useState<Record<number, any>>({});
  const [previousMonthData, setPreviousMonthData] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [churnResponse, highRiskResponse, reasonsResponse] = await Promise.all([
          axios.get(`http://54.206.52.197:8000/api/churn_rate?p_mt=${selectedMonth}`),
          axios.get(`http://54.206.52.197:8000/api/high_risk_customers?p_mt=${selectedMonth}`),
          axios.get(`http://54.206.52.197:8000/api/churn_reasons?p_mt=${selectedMonth}`)
        ]);

        const churnData = churnResponse.data.reduce((acc: Record<number, any>, item: any) => {
          acc[item.p_mt] = {
            p_mt: item.p_mt,
            total: item.total_customers || 0,
            churn: item.churn_customers || 0,
            new: item.new_customers || 0,
            churn_rate: item.total_customers
              ? parseFloat(((item.churn_customers / item.total_customers) * 100).toFixed(2))
              : 0,
            high_risk_customers: [],
            churn_reasons: {},
          };
          return acc;
        }, {});

        churnData[selectedMonth].high_risk_customers = highRiskResponse.data || [];
        churnData[selectedMonth].churn_reasons = reasonsResponse.data.reduce((acc: Record<string, number>, item: any) => {
          acc[item.reason] = item.percentage;
          return acc;
        }, {});

        // ✅ 데이터 저장 후 이전 달 데이터 가져오기
        setMonthlyData((prev) => ({
          ...prev,
          ...churnData,
        }));

        const previousMonth = getPreviousMonth(selectedMonth);
        const prevMonthResponse = await axios.get(`http://54.206.52.197:8000/api/churn_rate?p_mt=${previousMonth}`);
        const prevMonthData = prevMonthResponse.data.reduce((acc: Record<number, any>, item: any) => {
          acc[item.p_mt] = {
            churn: item.churn_customers || 0,
            new: item.new_customers || 0,
          };
          return acc;
        }, {});

        setPreviousMonthData(prevMonthData[previousMonth] || { churn: 0, new: 0 });

        setLoading(false);
      } catch (error) {
        console.error("🚨 데이터 가져오기 실패:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth]);

  const data = monthlyData[selectedMonth] || {
    total: 0,
    churn: 0,
    new: 0,
    churn_rate: 0,
    high_risk_customers: [],
    churn_reasons: {},
  };

  // ✅ 트렌드 계산 (데이터가 완전히 로드된 후 계산)
  const churnPercentage =
    previousMonthData.churn > 0
      ? ((data.churn - previousMonthData.churn) / previousMonthData.churn) * 100
      : 0;

  const newPercentage =
    previousMonthData.new > 0
      ? ((data.new - previousMonthData.new) / previousMonthData.new) * 100
      : 0;

  const churnTrend = churnPercentage > 0 ? "up" : churnPercentage < 0 ? "down" : "flat";
  const newCustomerTrend = newPercentage > 0 ? "up" : newPercentage < 0 ? "down" : "flat";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#53565A]">고객 해지 관리 대시보드</h1>
        <div className="flex items-center space-x-4">
          <MonthSelector onMonthChange={(month) => setSelectedMonth(parseInt(month, 10) || 1)} />
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">📊 데이터 로딩 중...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard title="총 고객 수" value={data.total?.toLocaleString() || "-"} />
            <StatCard
              title="해지 고객 수"
              value={data.churn?.toLocaleString() || "-"}
              trend={churnTrend}
              percentage={churnPercentage.toFixed(2) + "%"}
            />
            <StatCard
              title="신규 고객"
              value={data.new?.toLocaleString() || "-"}
              trend={newCustomerTrend}
              percentage={newPercentage.toFixed(2) + "%"}
            />
          </div>

          <ChurnRateChart selectedMonth={selectedMonth} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ImportantFeaturesChart selectedMonth={selectedMonth} />
            <ChurnReasonChart selectedMonth={selectedMonth.toString()} />
          </div>

          <RecentChurnsTable
            customers={data.high_risk_customers || []}
            referenceDate={format(new Date(), "yyyy-MM-dd")}
          />
        </>
      )}
    </div>
  );
}
