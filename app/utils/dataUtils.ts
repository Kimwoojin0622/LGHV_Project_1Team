import type { MonthlyData } from "../data/monthlyData"

export const calculateGrowthRate = (current: number, previous: number): string => {
  return (((current - previous) / previous) * 100).toFixed(2)
}

export const getLatestMonthData = (data: MonthlyData) => {
  const months = Object.keys(data)
  const latestMonth = months[months.length - 1]
  return data[latestMonth]
}

export const getPreviousMonthData = (data: MonthlyData) => {
  const months = Object.keys(data)
  const previousMonth = months[months.length - 2]
  return data[previousMonth]
}

