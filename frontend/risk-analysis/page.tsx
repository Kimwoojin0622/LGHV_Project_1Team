"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RiskDistributionChart from "../components/RiskDistributionChart";
import ChurnFactorsChart from "../components/ChurnFactorsChart";
import RiskTrendChart from "../components/RiskTrendChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const months = ["2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

export default function RiskAnalysis() {
  const [selectedMonth, setSelectedMonth] = useState("2월");
  const [riskStats, setRiskStats] = useState({ totalRiskCustomers: 0, veryHighRisk: 0 });
  const [prevRiskStats, setPrevRiskStats] = useState({ totalRiskCustomers: 0, veryHighRisk: 0 });

  useEffect(() => {
    async function fetchData() {
      try {
        const currentMonth = parseInt(selectedMonth.replace("월", ""));
        const prevMonth = currentMonth - 1;

        // ✅ 두 개의 API를 동시에 요청하여 딜레이 방지
        const [currentResponse, prevResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/risk-summary/monthly-summary`, { params: { month: currentMonth } }),
          prevMonth >= 2
            ? axios.get(`${API_BASE_URL}/risk-summary/monthly-summary`, { params: { month: prevMonth } })
            : Promise.resolve({ data: [] }) // 이전 달이 없으면 빈 값 반환
        ]);

        // ✅ 현재 월 데이터
        const currentData = currentResponse.data.length > 0 ? {
          totalRiskCustomers: currentResponse.data[0].category_risk + currentResponse.data[0].category_high_risk,
          veryHighRisk: currentResponse.data[0].category_high_risk,
        } : { totalRiskCustomers: 0, veryHighRisk: 0 };

        // ✅ 이전 월 데이터 (없으면 기본값 0)
        const prevData = prevResponse.data.length > 0 ? {
          totalRiskCustomers: prevResponse.data[0].category_risk + prevResponse.data[0].category_high_risk,
          veryHighRisk: prevResponse.data[0].category_high_risk,
        } : { totalRiskCustomers: 0, veryHighRisk: 0 };

        // ✅ 상태 업데이트를 한 번에 실행 (숫자 & 업다운 동시 반영)
        setRiskStats(currentData);
        setPrevRiskStats(prevData);

      } catch (error) {
        console.error("데이터 로드 실패:", error);
      }
    }

    fetchData();
  }, [selectedMonth]);

  // 🔼🔽 증가/감소 상태 계산 함수 (딜레이 없이 동기적으로 업데이트됨)
  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <span className="text-red-500 ml-2">▲</span>; // 증가 (빨강)
    if (current < previous) return <span className="text-blue-500 ml-2">▼</span>; // 감소 (파랑)
    return null; // 변화 없음
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#53565A]">위험군 분석</h1>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="월 선택" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month} value={month}>{month}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 🔹 총 위험군 고객 수 & 매우 위험 고객 수 (업다운 포함) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>총 위험군 고객 수</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold flex items-center">
              {riskStats.totalRiskCustomers.toLocaleString()}명
              {getTrendIcon(riskStats.totalRiskCustomers, prevRiskStats.totalRiskCustomers)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>매우 위험 고객 수</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold flex items-center">
              {riskStats.veryHighRisk.toLocaleString()}명
              {getTrendIcon(riskStats.veryHighRisk, prevRiskStats.veryHighRisk)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 🔹 위험도별 고객 분포 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>위험도별 고객 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskDistributionChart month={selectedMonth} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>주요 해지 요인</CardTitle>
          </CardHeader>
          <CardContent>
            <ChurnFactorsChart month={selectedMonth} />
          </CardContent>
        </Card>
      </div>

      {/* 🔹 위험군 변화 추이 추가 */}
      <Card>
        <CardHeader>
          <CardTitle>위험군 변화 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <RiskTrendChart />
        </CardContent>
      </Card>
    </div>
  );
}
