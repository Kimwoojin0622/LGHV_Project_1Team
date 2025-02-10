"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ChurnImpact {
  reason: string;
  percentage: number;
}

export default function ImportantFeaturesChart({ selectedMonth }: { selectedMonth: number }) {
  const [data, setData] = useState<ChurnImpact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChurnReasons = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/churn_reasons?p_mt=${selectedMonth}`);

        console.log("📊 Fetched Churn Impact Data:", response.data);

        // ✅ **모든 데이터에서 가장 큰 값 9개 선택 후 내림차순 유지**
        const sortedData = response.data
          .map((item: any) => ({
            reason: item.reason,
            percentage: Number(item.percentage),
          }))
          .sort((a: ChurnImpact, b: ChurnImpact) => b.percentage - a.percentage) // ✅ **큰 값부터 정렬**
          .slice(0, 9); // ✅ **상위 9개 선택 (내림차순 유지)**

        setData(sortedData);
      } catch (error) {
        console.error("🚨 주요 해지 요인 데이터를 가져오는데 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChurnReasons();
  }, [selectedMonth]);

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-[#53565A]">주요 해지 영향 요인</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-gray-600">데이터 불러오는 중...</div>
        ) : data.length === 0 ? (
          <div className="text-center text-gray-600">데이터가 없습니다.</div>
        ) : (
          <div style={{ width: "100%", height: 400 }}>
            <ResponsiveContainer>
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, "dataMax"]} />
                <YAxis dataKey="reason" type="category" width={150} /> {/* ✅ reversed 제거! */}
                <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                <Bar dataKey="percentage" fill="#ED174D">
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`rgba(237, 23, 77, ${0.7 - index * (0.4 / data.length)})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
