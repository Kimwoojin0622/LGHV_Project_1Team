"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Tooltip, Cell } from "recharts";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// 🔹 위험도별 색상 지정 (매우 위험 - 빨강, 위험 - 주황, 주의 - 노랑)
const COLORS = ["#FF0000", "#FFA500", "#FFFF00"];

export default function RiskDistributionChart({ month }: { month: string }) {
  // ✅ useState의 타입을 명확히 지정
  const [data, setData] = useState<{ name: string; value: number; fill: string }[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // ✅ API 요청 시 월(p_mt) 필터링 적용
        const response = await axios.get(`${API_BASE_URL}/risk-summary/risk-distribution`, {
          params: { month: parseInt(month.replace("월", "")) }, // "4월" → 4 변환
        });

        const fetchedData = response.data;

        // ✅ PieChart에 맞게 데이터 변환
        setData(
          Object.keys(fetchedData).map((key, idx) => ({
            name: key,            // "매우 위험", "위험", "주의"
            value: fetchedData[key], // 해당 월의 고객 수
            fill: COLORS[idx],    // 색상 매칭
          }))
        );
      } catch (error) {
        console.error("위험도별 고객 분포 데이터 로드 실패:", error);
      }
    }
    fetchData();
  }, [month]);

  return (
    <PieChart width={300} height={300}>
      <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.fill} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  );
}
