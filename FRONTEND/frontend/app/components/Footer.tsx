import type { FC } from "react"

const Footer: FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 mt-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} LG HelloVision. All rights reserved. by C.P. ❤️
          </div>
          <div className="mt-4 md:mt-0">
            <nav className="flex space-x-4">
              <a href="#" className="text-sm text-gray-500 hover:text-[#ED174D]">
                개인정보처리방침
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-[#ED174D]">
                이용약관
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-[#ED174D]">
                고객센터
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

