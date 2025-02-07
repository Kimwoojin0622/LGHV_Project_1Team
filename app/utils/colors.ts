export const riskColors = {
  "매우 위험": "#ED174D",
  위험: "#FF8042",
  주의: "#FFBB28",
  보통: "#82CA9D",
  안정: "#2563EB",
}

export const getRiskColor = (risk: keyof typeof riskColors) => {
  return {
    backgroundColor: riskColors[risk],
    color: "#FFFFFF",
  }
}

