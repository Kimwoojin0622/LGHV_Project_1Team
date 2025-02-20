/**
 * MonthSelector.tsx
 * 데이터 조회 기준 월을 선택하는 드롭다운 컴포넌트
 * 
 * 기능:
 * 1. 월 선택 드롭다운
 *    - 2월부터 12월까지 선택 가능
 *    - 현재 선택된 월 표시
 *    - 월 변경 시 상위 컴포넌트에 통지
 * 
 * Props:
 * - selectedMonth: 현재 선택된 월 (number)
 * - onChange: 월 선택 변경 시 호출되는 콜백 함수
 * 
 * 스타일:
 * - 너비 180px 고정
 * - shadcn/ui Select 컴포넌트 사용
 * - 반응형 드롭다운 메뉴
 * - 기본 placeholder "월 선택"
 */

"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MonthSelectorProps {
  selectedMonth: number;
  onChange: (month: number) => void;
}

export default function MonthSelector({ selectedMonth, onChange }: MonthSelectorProps) {
  // 2월부터 12월까지만 표시
  const months = Array.from({ length: 11 }, (_, i) => i + 2);

  return (
    <Select
      value={selectedMonth.toString()}
      onValueChange={(value) => onChange(parseInt(value))}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="월 선택" />
      </SelectTrigger>
      <SelectContent>
        {months.map((month) => (
          <SelectItem key={month} value={month.toString()}>
            {month}월
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}