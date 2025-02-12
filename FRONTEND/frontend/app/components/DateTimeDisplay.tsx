/**
 * DateTimeDisplay.tsx
 * 현재 날짜/시간과 인사말을 표시하는 컴포넌트
 * 
 * 기능:
 * 1. 현재 날짜와 시간을 실시간으로 표시 (1초 간격 업데이트)
 * 2. 시간대별 개인화된 인사말 표시
 *    - 아침 (7-12시): "좋은 아침이에요"
 *    - 오후 (12-18시): "활기차게 오후를 보내요"
 *    - 저녁 (18-22시): "오늘 하루 고생 많으셨어요"
 *    - 밤 (22-7시): "잘 시간이에요"
 * 3. 인사말 15초 후 자동 숨김
 * 4. 한국어 로컬라이즈된 날짜/시간 형식 사용
 */

"use client"

import { useState, useEffect } from "react"

export default function DateTimeDisplay() {
  const [dateTime, setDateTime] = useState<Date | null>(null)
  const [showGreeting, setShowGreeting] = useState(true)
  const [isGreetingVisible, setIsGreetingVisible] = useState(true)
  const [firstAccessTime, setFirstAccessTime] = useState<Date | null>(null)

  useEffect(() => {
    // 초기 시간과 최초 접속 시간 설정
    const now = new Date()
    setDateTime(now)
    
    // 오늘 날짜의 키 생성 (YYYY-MM-DD 형식)
    const today = now.toISOString().split('T')[0]
    const storageKey = `firstAccessTime_${today}`
    
    // 최초 접속 시간을 localStorage에서 가져오거나 현재 시간으로 설정
    const storedTime = localStorage.getItem(storageKey)
    if (storedTime) {
      setFirstAccessTime(new Date(storedTime))
    } else {
      localStorage.setItem(storageKey, now.toString())
      setFirstAccessTime(now)
    }

    // 1초마다 시간 업데이트
    const timer = setInterval(() => setDateTime(new Date()), 1000)

    // 15초 후에 인사말 페이드아웃 시작
    const greetingTimer = setTimeout(() => {
      setShowGreeting(false)
      // 페이드아웃 애니메이션이 끝난 후에 완전히 제거
      setTimeout(() => {
        setIsGreetingVisible(false)
      }, 1000)
    }, 15000)

    // 컴포넌트 언마운트 시 정리
    return () => {
      clearInterval(timer)
      clearTimeout(greetingTimer)
    }
  }, [])

  // 클라이언트 사이드 첫 렌더링 전까지 아무것도 표시하지 않음
  if (!dateTime) return null

  const getGreeting = () => {
    const hour = dateTime.getHours()
    
    if (hour >= 7 && hour < 12) {
      return "안녕하세요, 변수민님 좋은 아침이에요 😄"
    } else if (hour >= 12 && hour < 18) {
      return "안녕하세요, 변수민님 활기차게 오후를 보내요! 😊"
    } else if (hour >= 18 && hour < 22) {
      return "안녕하세요, 변수민님 오늘 하루 고생 많으셨어요! 😌"
    } else {
      return "잘 시간이에요! 😴"
    }
  }

  return (
    <div className="flex items-center gap-8">
      {isGreetingVisible && (
        <span className={`text-gray-700 font-roboto font-bold ${showGreeting ? 'greeting-fade-enter' : 'greeting-fade-exit'}`}>
          {getGreeting()}
        </span>
      )}
      {!isGreetingVisible && firstAccessTime && (
        <span className="text-gray-700 font-roboto font-bold">
          {firstAccessTime.toLocaleDateString("ko-KR", {month: "long", day: "numeric"})} 최초 접속 시간: {firstAccessTime.toLocaleTimeString("ko-KR")}
        </span>
      )}
      <div className="text-sm text-gray-600">
        <div>{dateTime.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}</div>
        <div>{dateTime.toLocaleTimeString("ko-KR")}</div>
      </div>
    </div>
  )
}
