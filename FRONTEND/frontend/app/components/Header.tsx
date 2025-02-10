import Image from "next/image"
import Link from "next/link"
import DateTimeDisplay from "./DateTimeDisplay"

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-200">
      <div className="h-full px-6 flex items-center justify-between">
        <Link href="/">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LG_HELLOVISON-C5xQgqHUbxf9TYQIFAKR295d8QeFOl.svg"
            alt="LG헬로비전 로고"
            width={150}
            height={22}
            priority
          />
        </Link>
        <DateTimeDisplay />
      </div>
    </header>
  )
}

