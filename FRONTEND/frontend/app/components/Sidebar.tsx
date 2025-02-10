"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, AlertTriangle } from "lucide-react"

interface MenuItem {
  name: string
  href: string
  icon: React.ElementType
}

const menuItems: MenuItem[] = [
  {
    name: "대시보드",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "고객 조회",
    href: "/customer-search",
    icon: Users,
  },
  {
    name: "위험군 분석",
    href: "/risk-analysis",
    icon: AlertTriangle,
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-[#A50034] min-h-[calc(100vh-4rem)] flex-shrink-0">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.name}>
                <div className="group">
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out ${
                      pathname === item.href
                        ? "bg-white text-[#6B6B6B] font-bold shadow-md"
                        : "text-white hover:bg-[#8A002C] hover:scale-105 hover:shadow-md font-bold"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 transition-transform duration-200 ${
                        pathname === item.href ? "text-[#6B6B6B]" : "text-white group-hover:scale-110"
                      }`}
                    />
                    <span>{item.name}</span>
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

