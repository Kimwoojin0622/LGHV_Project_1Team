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

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`${API_BASE_URL}/risk-summary/monthly-summary`, {
          params: { month: parseInt(selectedMonth.replace("월", "")) },
        });

        if (response.data.length > 0) {
          setRiskStats({
            totalRiskCustomers: response.data[0].category_risk + response.data[0].category_high_risk,
            veryHighRisk: response.data[0].category_high_risk,
          });
        }
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      }
    }
    fetchData();
  }, [selectedMonth]);

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>총 위험군 고객 수</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{riskStats.totalRiskCustomers.toLocaleString()}명</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>매우 위험 고객 수</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{riskStats.veryHighRisk.toLocaleString()}명</p>
          </CardContent>
        </Card>
      </div>

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

      {/* ✅ 위험군 변화 추이 추가 */}
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
