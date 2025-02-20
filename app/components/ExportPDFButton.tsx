"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { FileDown } from "lucide-react";
import axios from "axios";
import { useState } from "react";

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
  "AGMT_END_SEG": "약정 종료일",
  "TOTAL_USED_DAYS": "총 사용 일수",
  "SCRB_PATH_NM_GRP": "유치경로"
};

interface ChurnImpact {
  reason: string;
  percentage: number;
}

export default function ExportPDFButton() {
  const [loading, setLoading] = useState(false);

  const createPDFContent = async (selectedMonth: string, data: any, churnReasons: ChurnImpact[]) => {
    try {
      // 임시 div 생성
      const tempDiv = document.createElement('div');
      tempDiv.style.width = '800px';
      tempDiv.style.padding = '40px';
      tempDiv.style.background = 'white';
      tempDiv.style.position = 'fixed';
      tempDiv.style.top = '-9999px';
      tempDiv.style.left = '-9999px';
      
      // 스타일 적용
      const style = document.createElement('style');
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');
        .pdf-content {
          font-family: 'Noto Sans KR', sans-serif;
          color: #000;
        }
        .pdf-title {
          font-size: 24px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 30px;
        }
        .pdf-section {
          margin-bottom: 30px;
        }
        .pdf-section-title {
          font-size: 18px;
          font-weight: 500;
          margin-bottom: 15px;
        }
        .pdf-item {
          margin: 10px 0;
          font-size: 14px;
        }
        .pdf-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .pdf-table th, .pdf-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        .pdf-table th {
          background-color: #f5f5f5;
        }
      `;
      
      // HTML 내용 생성
      tempDiv.innerHTML = `
        <div class="pdf-content">
          <div class="pdf-title">${selectedMonth}월 리포트</div>
          
          <div class="pdf-section">
            <div class="pdf-section-title">■ 고객 현황</div>
            <div class="pdf-item">총 고객 수: ${data.dashboard.total.toLocaleString()}명</div>
            <div class="pdf-item">해지 고객 수: ${data.dashboard.churn.toLocaleString()}명</div>
            <div class="pdf-item">신규 고객: ${data.dashboard.new.toLocaleString()}명</div>
            <div class="pdf-item">해지율: ${data.dashboard.churnRate.toFixed(2)}%</div>
          </div>
          
          <div class="pdf-section">
            <div class="pdf-section-title">■ 위험군 현황</div>
            <div class="pdf-item">총 위험군 고객 수: ${data.risk.total.toLocaleString()}명</div>
            <div class="pdf-item">매우 위험 고객 수: ${data.risk.veryHigh.toLocaleString()}명</div>
            <div class="pdf-item">위험 고객 수: ${data.risk.high.toLocaleString()}명</div>
            <div class="pdf-item">주의 고객 수: ${data.risk.caution.toLocaleString()}명</div>
          </div>

          <div class="pdf-section">
            <div class="pdf-section-title">■ 주요 해지 영향 요인 (상위 9개)</div>
            <table class="pdf-table">
              <thead>
                <tr>
                  <th>순위</th>
                  <th>요인</th>
                  <th>영향도</th>
                </tr>
              </thead>
              <tbody>
                ${churnReasons.map((item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.reason}</td>
                    <td>${item.percentage.toFixed(2)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      // 스타일과 div를 문서에 추가
      document.head.appendChild(style);
      document.body.appendChild(tempDiv);

      // 폰트가 로드될 때까지 대기
      await document.fonts.ready;

      // HTML을 이미지로 변환
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // 임시 요소들 제거
      document.head.removeChild(style);
      document.body.removeChild(tempDiv);

      // PDF 생성
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      return pdf;
    } catch (error) {
      console.error('PDF 생성 중 오류:', error);
      throw error;
    }
  };

  const exportToPDF = async () => {
    try {
      setLoading(true);

      // URL에서 현재 선택된 월 가져오기
      const searchParams = new URLSearchParams(window.location.search);
      const monthParam = searchParams.get('month') || "12";
      const selectedMonth = monthParam.replace("월", "");

      // 데이터 가져오기
      const [dashboardResponse, riskResponse, churnReasonsResponse] = await Promise.all([
        axios.get(`http://54.206.52.197:8000/api/churn_rate?p_mt=${selectedMonth}`),
        axios.get(`http://54.206.52.197:8000/risk-summary/monthly-summary?month=${selectedMonth}`),
        axios.get(`http://54.206.52.197:8000/api/churn_reasons?p_mt=${selectedMonth}`)
      ]);

      // 데이터 정리
      const dashboardData = dashboardResponse.data[0] || {};
      const riskData = riskResponse.data[0] || {};

      // 주요 해지 요인 데이터 정리 (한글 매핑 적용)
      const churnReasons = churnReasonsResponse.data
        .map((item: any) => ({
          reason: featureTranslations[item.reason] || item.reason,
          percentage: Math.round((Number(item.percentage) * 100) * 100) / 100,
        }))
        .sort((a: ChurnImpact, b: ChurnImpact) => b.percentage - a.percentage)
        .slice(0, 9);

      const data = {
        dashboard: {
          total: dashboardData.total_customers || 0,
          churn: dashboardData.churn_customers || 0,
          new: dashboardData.new_customers || 0,
          churnRate: (dashboardData.churn_customers / dashboardData.total_customers) * 100 || 0
        },
        risk: {
          total: riskData.category_high_risk + riskData.category_risk + riskData.category_caution || 0,
          veryHigh: riskData.category_high_risk || 0,
          high: riskData.category_risk || 0,
          caution: riskData.category_caution || 0
        }
      };

      // PDF 생성
      const pdf = await createPDFContent(selectedMonth, data, churnReasons);

      // PDF 저장
      const fileName = `${selectedMonth}월_리포트_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error("PDF 내보내기 실패:", error);
      alert("PDF 내보내기에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group">
      <div
        onClick={exportToPDF}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out text-white hover:bg-[#8A002C] hover:scale-105 hover:shadow-md font-bold cursor-pointer ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <FileDown className="h-5 w-5 transition-transform duration-200 text-white group-hover:scale-110" />
        <span>{loading ? "내보내는 중..." : "PDF 내보내기"}</span>
      </div>
    </div>
  );
}