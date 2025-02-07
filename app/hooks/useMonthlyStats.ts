"use client";
import { useMemo, useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const useMonthlyStats = () => {
  const [monthlyData, setMonthlyData] = useState<any | null>(null);
  const [previousMonthData, setPreviousMonthData] = useState<any | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // 최신 월 데이터 가져오기
        const response = await axios.get(`${API_BASE_URL}/customers/monthly-summary/latest`);
        setMonthlyData(response.data);

        // 최신 데이터의 월 번호(p_mt)를 사용해 이전 월 데이터 가져오기 (월 번호가 2월보다 클 때만)
        const currentMonth = response.data.p_mt;
        if (currentMonth && currentMonth > 2) {
          const prevResponse = await axios.get(`${API_BASE_URL}/customers/monthly-summary`, {
            params: { month: currentMonth - 1 },
          });
          setPreviousMonthData(prevResponse.data);
        } else {
          setPreviousMonthData(null);
        }
      } catch (error) {
        console.error("월별 데이터 로드 실패:", error);
      }
    }
    fetchData();
  }, []);

  const stats = useMemo(() => {
    if (!monthlyData) return null;

    const prevTotal = previousMonthData?.total_customers || monthlyData.total_customers;
    const prevChurn = previousMonthData?.churn_customers || monthlyData.churn_customers;
    const prevNew = previousMonthData?.new_customers || monthlyData.new_customers;

    return {
      total: {
        value: monthlyData.total_customers,
        formatted: monthlyData.total_customers.toLocaleString(),
        trend: monthlyData.total_customers > prevTotal ? "up" : "down" as "up" | "down",
      },
      churn: {
        value: monthlyData.churn_customers,
        formatted: monthlyData.churn_customers.toLocaleString(),
        percentage: ((monthlyData.churn_customers / monthlyData.total_customers) * 100).toFixed(2),
        trend: monthlyData.churn_customers > prevChurn ? "up" : "down" as "up" | "down",
      },
      new: {
        value: monthlyData.new_customers,
        formatted: monthlyData.new_customers.toLocaleString(),
        percentage: ((monthlyData.new_customers / monthlyData.total_customers) * 100).toFixed(2),
        trend: monthlyData.new_customers > prevNew ? "up" : "down" as "up" | "down",
      },
    };
  }, [monthlyData, previousMonthData]);

  return { stats };
};
