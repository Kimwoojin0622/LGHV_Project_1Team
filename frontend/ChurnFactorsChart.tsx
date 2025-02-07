"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function ChurnFactorsChart({ month }: { month: string }) {
  const [data, setData] = useState<{ factor: string; impact: number }[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`${API_BASE_URL}/risk-summary/churn-factors`, {
          params: { month: parseInt(month.replace("월", "")) },
        });

        setData(response.data);
      } catch (error) {
        console.error("주요 해지 요인 데이터 로드 실패:", error);
      }
    }
    fetchData();
  }, [month]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="factor" type="category" width={100} />
        <Tooltip />
        <Bar dataKey="impact" fill="#ED174D" barSize={30} />
      </BarChart>
    </ResponsiveContainer>
  );
}
