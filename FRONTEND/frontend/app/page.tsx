/**
 * page.tsx
 * 고객 해지 관리 대시보드의 메인 페이지 컴포넌트
 * 
 * 기능:
 * 1. 데이터 관리
 *    - 월별 데이터 조회 및 관리
 *    - 이전 월과의 비교 분석
 *    - URL 파라미터를 통한 월 정보 유지
 * 
 * 2. 데이터 시각화
 *    - 통계 카드 (총 고객/해지 고객/신규 고객)
 *    - 해지율 차트
 *    - 주요 해지 영향 요인 차트
 *    - 해지 사유 분포 차트
 *    - 고위험 고객 테이블
 * 
 * 3. API 통합
 *    - /api/churn_rate: 해지율 데이터
 *    - /api/high_risk_customers: 고위험 고객 목록
 *    - /api/churn_reasons: 해지 사유 통계
 * 
 * 4. 상태 관리
 *    - 선택된 월 (selectedMonth)
 *    - 월별 데이터 (monthlyData)
 *    - 로딩 상태 (loading)
 * 
 * 5. 유틸리티 함수
 *    - getPreviousMonth: 이전 월 계산
 *    - calculateTrend: 증감 추세 계산
 * 
 * 스타일:
 * - 반응형 그리드 레이아웃
 * - LG HelloVision 브랜드 컬러 (#53565A)
 * - 일관된 간격 (gap-4, gap-6)
 * - 모바일/데스크톱 최적화 (md:grid-cols-3, lg:grid-cols-2)
 */

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
  return currentMonth === 1 ? 12 : currentMonth - 1;  // 1월이면 12월로, 그 외에는 이전 달로
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
  // URL에서 월 파라미터 가져오기
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const monthParam = searchParams.get('month');
  const initialMonth = monthParam ? parseInt(monthParam) : 12;  // 기본값을 12월로 설정

  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);
  const [monthlyData, setMonthlyData] = useState<Record<number, MonthlyData>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // 월 변경 시 URL 업데이트
  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('month', month.toString());
    window.history.pushState({}, '', newUrl.toString());
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const previousMonth = getPreviousMonth(selectedMonth);
        
        // 현재 월과 이전 월의 데이터를 모두 가져옵니다
        const responses = await Promise.all([
          axios.get(`http://localhost:8000/api/churn_rate?p_mt=${selectedMonth}`).catch(() => ({ data: [] })),
          axios.get(`http://localhost:8000/api/churn_rate?p_mt=${previousMonth}`).catch(() => ({ data: [] })),
          axios.get(`http://localhost:8000/api/high_risk_customers?p_mt=${selectedMonth}`).catch(() => ({ data: [] })),
          axios.get(`http://localhost:8000/api/churn_reasons?p_mt=${selectedMonth}`).catch(() => ({ data: [] }))
        ]);

        const [currentChurnResponse, previousChurnResponse, highRiskResponse, reasonsResponse] = responses;

        const processChurnData = (response: any) => {
          if (!response.data || response.data.length === 0) return {};
          
          return response.data.reduce((acc: Record<number, MonthlyData>, item: any) => {
            if (item && item.p_mt) {
              acc[item.p_mt] = {
                p_mt: item.p_mt,
                total: item.total_customers || 0,
                churn: item.churn_customers || 0,
                new: item.new_customers || 0,
                churn_rate: parseFloat(((item.churn_customers / item.total_customers) * 100).toFixed(2)) || 0,
                high_risk_customers: [],
                churn_reasons: {}
              };
            }
            return acc;
          }, {});
        };

        const currentData = processChurnData(currentChurnResponse);
        const previousData = processChurnData(previousChurnResponse);

        // 데이터 병합
        const mergedData = {
          ...previousData,
          ...currentData,
        };

        // 현재 월의 추가 데이터 설정
        if (mergedData[selectedMonth]) {
          mergedData[selectedMonth].high_risk_customers = highRiskResponse.data || [];
          mergedData[selectedMonth].churn_reasons = reasonsResponse.data.reduce((acc: Record<string, number>, item: any) => {
            acc[item.reason] = item.percentage;
            return acc;
          }, {});
        }

        setMonthlyData(mergedData);
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
          <MonthSelector
            selectedMonth={selectedMonth}
            onChange={handleMonthChange}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="총 고객 수"
          value={data.total?.toLocaleString() || "0"}
        />
        <StatCard
          title="해지 고객 수"
          value={data.churn?.toLocaleString() || "0"}
          trend={churnTrend.trend}
          percentage={churnTrend.percentage + "%"}
        />
        <StatCard
          title="신규 고객"
          value={data.new?.toLocaleString() || "0"}
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
