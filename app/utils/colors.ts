export const riskColors = {
  "매우 위험": "#ED174D", // 빨강
  위험: "#FF8042", // 주황
  주의: "#FFBB28", // 노랑
  양호: "#82CA9D", // 연두
  안정: "#2563EB", // 파랑
};

// ✅ 단순히 텍스트 색상만 반환
export const getRiskColor = (risk: keyof typeof riskColors) => riskColors[risk] || "#000000";
  
