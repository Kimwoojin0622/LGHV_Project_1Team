"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const months = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]

interface MonthSelectorProps {
  onMonthChange: (month: string) => void
}

export default function MonthSelector({ onMonthChange }: MonthSelectorProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>("3월")

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
    onMonthChange(month)
  }

  return (
    <Select onValueChange={handleMonthChange} value={selectedMonth}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="월 선택" />
      </SelectTrigger>
      <SelectContent>
        {months.map((month) => (
          <SelectItem key={month} value={month}>
            {month}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

