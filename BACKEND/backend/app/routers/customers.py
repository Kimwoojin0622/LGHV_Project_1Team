import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { FeatureImportanceData } from "../types/customer";

// ChartJS 구성요소 등록
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ChurnFactorsChartProps {
  month: string;
  customerSha2Hash: string;
}

// 피처 한글명 매핑 (필요에 따라 수정 가능)
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

const ChurnFactorsChart: React.FC<ChurnFactorsChartProps> = ({ month, customerSha2Hash }) => {
  const [featureData, setFeatureData] = useState<FeatureImportanceData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchFeatureData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${customerSha2Hash}/feature-importance`,
          { params: { p_mt: parseInt(month, 10) } }
        );
        setFeatureData(response.data);
      } catch (error) {
        console.error("주요 해지 요인 데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatureData();
  }, [month, customerSha2Hash]);

  if (loading) {
    return <div>주요 해지 요인 데이터를 불러오는 중...</div>;
  }

  if (!featureData || featureData.length === 0) {
    return <div>주요 해지 요인 데이터가 없습니다.</div>;
  }

  // 영향값(impact_value_1) 기준 내림차순 정렬
  const sortedFeatures = [...featureData].sort(
    (a, b) => (b.impact_value_1 || 0) - (a.impact_value_1 || 0)
  );

  // 차트 데이터 구성
  const data = {
    labels: sortedFeatures.map((feature) =>
      featureTranslations[feature.feature_1] || feature.feature_1
    ),
    datasets: [
      {
        label: "영향도",
        data: sortedFeatures.map((feature) => feature.impact_value_1),
        backgroundColor: "rgba(237,23,77,0.6)",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "주요 해지 요인",
      },
    },
  };

  return (
    <div>
      <Bar data={data} options={options} />
    </div>
  );
};

export default ChurnFactorsChart;
