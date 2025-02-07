"use client"

import CustomerTable from "../components/CustomerTable"
import StatCard from "../components/StatCard"
import { useMonthlyStats } from "../hooks/useMonthlyStats"

export default function CustomerSearch() {
  const { stats } = useMonthlyStats()

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-6 text-[#53565A]">고객 조회</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="총 고객 수" value={stats.total.formatted} />
        <StatCard
          title="해지 고객 수"
          value={stats.churn.formatted}
          trend="up"
          percentage={stats.churn.percentage + "%"}
        />
        <StatCard title="신규 고객" value={stats.new.formatted} trend="up" percentage={stats.new.percentage + "%"} />
      </div>
      <CustomerTable />
    </div>
  )
}

