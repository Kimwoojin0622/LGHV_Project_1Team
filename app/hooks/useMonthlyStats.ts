import { useMemo, useState, useEffect } from "react"
import { monthlyData } from "../data/monthlyData"
import axios from "axios"
import { getLatestMonthData, getPreviousMonthData, calculateGrowthRate } from "../utils/dataUtils"

function calculateTrend(current?: number, previous?: number) {
  if (!previous || !current || previous === 0) {
    return { trend: undefined, percentage: "0.00" }
  }
  const diff = current - previous
  return {
    trend: diff > 0 ? "up" : diff < 0 ? "down" : undefined,
    percentage: Math.abs((diff / previous) * 100).toFixed(2),
  }
}


export const useMonthlyStats = () => {
  const latestMonthData = useMemo(() => getLatestMonthData(monthlyData), [])
  const previousMonthData = useMemo(() => getPreviousMonthData(monthlyData), [])

  
  const stats = useMemo(
    () => ({
      total: {
        value: latestMonthData.total,
        formatted: latestMonthData.total.toLocaleString(),
      },
      churn: {
        value: latestMonthData.churn,
        formatted: latestMonthData.churn.toLocaleString(),
        percentage: latestMonthData.churn_rate.toFixed(2),
      },
      new: {
        value: latestMonthData.new,
        formatted: latestMonthData.new.toLocaleString(),
        percentage: ((latestMonthData.new / latestMonthData.total) * 100).toFixed(2),
      },
    }),
    [latestMonthData],
  )

  return { stats }
}

