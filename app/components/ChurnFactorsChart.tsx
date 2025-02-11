"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://54.206.52.197:8000";

// 주요 해지 요인 한글 매핑
const featureTranslations: { [key: string]: string } = {
  "TV_I_CNT": "TV 사용 댓수",
  "AGMT_KIND_NM": "약정 종류",
  "MEDIA_NM_GRP": "상품 매체명",
  "PROD_NM_GRP": "상품명",
  "CH_HH_AVG_MONTH1": "1개월 평균 채널 시청시간",
  "BUNDLE_YN": "결합 상품 유무",
  "VOC_STOP_CANCEL_MONTH1_YN": "최근 한 달 내 해지 상담 여부",
  "VOC_TOTAL_MONTH1_YN": "최근 한 달 내 전체 상담 여부",
  "MONTHS_REMAINING": "약정 남은 개월 수",
  "STB_RES_1M_YN": "셋톱박스 휴면 유무",
  "CH_LAST_DAYS_BF_GRP": "최근 시청일",
  "INHOME_RATE": "집돌이 지수",
  "AGE_GRP10": "연령대",
  "AGMT_END_SEG": "약정 종료일"
};

export default function ChurnFactorsChart({ month }: { month: string }) {
  const [data, setData] = useState<{ factor: string; impact: number }[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`${API_BASE_URL}/risk-summary/churn-factors`, {
          params: { month: parseInt(month.replace("월", "")) },
        });

        // 데이터 한글 변환 적용
        const translatedData = response.data.map((item: { factor: string; impact: number }) => ({
          factor: featureTranslations[item.factor] || item.factor,
          impact: item.impact,
        }));

        setData(translatedData);
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
        <YAxis dataKey="factor" type="category" width={120} />
        <Tooltip />
        <Bar dataKey="impact" fill="#ED174D" barSize={30} />
      </BarChart>
    </ResponsiveContainer>
  );
}
