"use client"

import { useState, useEffect } from "react"

export default function DateTimeDisplay() {
  const [dateTime, setDateTime] = useState<Date | null>(null)

  useEffect(() => {
    // Set initial time only after component mounts on client
    setDateTime(new Date())

    // Update time every second
    const timer = setInterval(() => setDateTime(new Date()), 1000)

    // Cleanup interval on unmount
    return () => clearInterval(timer)
  }, [])

  // Don't render anything until after first client-side render
  if (!dateTime) return null

  return (
    <div className="text-sm text-gray-600">
      <div>{dateTime.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}</div>
      <div>{dateTime.toLocaleTimeString("ko-KR")}</div>
    </div>
  )
}

