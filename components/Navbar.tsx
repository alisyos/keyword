import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 페이지 경로에 따라 활성화된 링크 스타일 지정
  const getLinkClass = (path: string) => {
    const baseClasses = "px-4 py-2 rounded-lg transition-all duration-300 font-medium";
    return router.pathname === path
      ? `${baseClasses} bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg`
      : `${baseClasses} text-gray-600 hover:bg-blue-50`;
  };
  
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white shadow-lg' 
        : 'bg-gradient-to-b from-blue-50 to-white/80 backdrop-blur-md'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 및 브랜드 */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">GPTKOREA</span>
              <span className="ml-2 text-gray-600 font-medium">키워드 분석</span>
            </Link>
          </div>
          
          {/* 데스크톱 메뉴 */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link href="/" className={getLinkClass('/')}>
                키워드 분석
              </Link>
              <Link href="/keyword-expansion" className={getLinkClass('/keyword-expansion')}>
                키워드 확장
              </Link>
              <Link href="/ad-analysis" className={getLinkClass('/ad-analysis')}>
                광고 분석
              </Link>
            </div>
          </div>
          
          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-white hover:bg-blue-600 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">메뉴 열기</span>
              {/* 아이콘 - 메뉴 닫힘 */}
              <svg
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* 아이콘 - 메뉴 열림 */}
              <svg
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <div
        className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`}
        id="mobile-menu"
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
          <Link href="/" className={`block ${getLinkClass('/')}`}>
            키워드 분석
          </Link>
          <Link href="/keyword-expansion" className={`block ${getLinkClass('/keyword-expansion')}`}>
            키워드 확장
          </Link>
          <Link href="/ad-analysis" className={`block ${getLinkClass('/ad-analysis')}`}>
            광고 분석
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 