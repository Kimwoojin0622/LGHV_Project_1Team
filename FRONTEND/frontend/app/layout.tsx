import "./globals.css"
import Header from "./components/Header"
import Sidebar from "./components/Sidebar"
import Footer from "./components/Footer"
import { Roboto } from "next/font/google"

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
})

export const metadata = {
  title: "LG헬로비전 고객 해지 관리 대시보드",
  description: "고객 해지 현황 및 마케팅 대안 분석",
  icons: {
    icon: [
      {
        url: "/lg-hellovision-icon.svg",
        type: "image/svg+xml",
      },
    ],
    shortcut: ["/lg-hellovision-icon.svg"],
    apple: [
      {
        url: "/lg-hellovision-icon.svg",
        type: "image/svg+xml",
        sizes: "any",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={`${roboto.className} bg-white text-gray-900 flex flex-col min-h-screen`}>
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 bg-gray-50 overflow-auto">{children}</main>
        </div>
        <Footer />
      </body>
    </html>
  )
}

