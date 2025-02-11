"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://54.206.52.197:8000";

export default function RiskTrendChart() {
  // ✅ 상태 변수 (월별 데이터 저장)
  const [data, setData] = useState<{ p_mt: number; "매우 위험": number; "위험": number; "주의": number }[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`${API_BASE_URL}/risk-summary/risk-trend`);
        setData(response.data);
      } catch (error) {
        console.error("위험군 변화 추이 데이터 로드 실패:", error);
      }
    }
    fetchData();
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="p_mt" tickFormatter={(tick) => `${tick}월`} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="매우 위험" stroke="#FF0000" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="위험" stroke="#FFA500" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="주의" stroke="#FFFF00" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
