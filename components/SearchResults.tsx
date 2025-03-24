import React, { useState } from 'react';

interface ResultData {
  summary: string;
  links: Array<{
    title: string;
    url: string;
    description?: string;
  }>;
}

interface SearchResultsProps {
  results: {
    naverBlog: ResultData | null;
    naverCafe: ResultData | null;
    youtube: ResultData | null;
    naverNews: ResultData | null;
  };
  searchKeyword: string;
}

// 탭 버튼 컴포넌트
const TabButton = ({ 
  active, 
  onClick, 
  icon, 
  children,
  count
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode;
  children: React.ReactNode;
  count: number;
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
        active 
          ? 'bg-white text-indigo-600 shadow-md' 
          : 'text-gray-600 hover:bg-white/50 hover:text-indigo-600'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
        active ? 'bg-indigo-50' : 'bg-gray-100'
      }`}>
        {icon}
      </div>
      <div className="flex flex-col items-start">
        <span className="font-medium">{children}</span>
        <span className="text-xs text-gray-500">{count}개의 결과</span>
      </div>
    </button>
  );
};

const ResultSection = ({ 
  title, 
  data, 
  showAnalysisButton = false, 
  searchKeyword,
  analysisType = 'blog'
}: { 
  title: string; 
  data: ResultData | null; 
  showAnalysisButton?: boolean;
  searchKeyword?: string;
  analysisType?: 'blog' | 'cafe' | 'youtube' | 'news';
}) => {
  if (!data) return null;

  const handleOpenAnalysis = () => {
    window.open(`/keyword-analysis?keyword=${encodeURIComponent(searchKeyword || '')}&type=${analysisType}`, '_blank', 'width=1000,height=800');
  };

  // 플랫폼별 아이콘 선택
  const getPlatformIcon = () => {
    switch (analysisType) {
      case 'blog':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5z" />
            <path d="M11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
          </svg>
        );
      case 'cafe':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm1 4a1 1 0 100 2h12a1 1 0 100-2H4zm0 4a1 1 0 100 2h12a1 1 0 100-2H4zm0 4a1 1 0 100 2h12a1 1 0 100-2H4z" clipRule="evenodd" />
          </svg>
        );
      case 'youtube':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
        );
      case 'news':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
            <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all hover:shadow-xl">
      <div className="border-b border-gray-100">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center
              ${analysisType === 'blog' ? 'bg-green-100 text-green-600' : 
                analysisType === 'cafe' ? 'bg-blue-100 text-blue-600' : 
                analysisType === 'news' ? 'bg-yellow-100 text-yellow-600' :
                'bg-red-100 text-red-600'}`}>
              {getPlatformIcon()}
            </div>
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          </div>
          {showAnalysisButton && searchKeyword && (
            <button
              onClick={handleOpenAnalysis}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              세부 분석
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">주요 내용 요약</h3>
          <div className="bg-gray-50 rounded-xl p-4 text-gray-600">
            <p className="whitespace-pre-line">{data.summary}</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">관련 콘텐츠</h3>
          <div className="space-y-4">
            {data.links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all"
              >
                <h4 className="text-indigo-600 font-medium mb-2 line-clamp-2">
                  {link.title}
                </h4>
                {link.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {link.description}
                  </p>
                )}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SearchResults: React.FC<SearchResultsProps> = ({ results, searchKeyword }) => {
  const [activeTab, setActiveTab] = useState<'blog' | 'cafe' | 'youtube' | 'news'>('blog');
  const hasResults = results.naverBlog || results.naverCafe || results.youtube || results.naverNews;

  if (!hasResults) return null;

  return (
    <div>
      {/* 탭 버튼 */}
      <div className="bg-gray-100/80 p-2 rounded-2xl mb-6 backdrop-blur-sm sticky top-4 z-10">
        <div className="flex gap-2 overflow-x-auto">
          <TabButton
            active={activeTab === 'blog'}
            onClick={() => setActiveTab('blog')}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5z" />
                <path d="M11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
              </svg>
            }
            count={results.naverBlog?.links.length || 0}
          >
            블로그
          </TabButton>
          <TabButton
            active={activeTab === 'cafe'}
            onClick={() => setActiveTab('cafe')}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm1 4a1 1 0 100 2h12a1 1 0 100-2H4zm0 4a1 1 0 100 2h12a1 1 0 100-2H4zm0 4a1 1 0 100 2h12a1 1 0 100-2H4z" clipRule="evenodd" />
              </svg>
            }
            count={results.naverCafe?.links.length || 0}
          >
            카페
          </TabButton>
          <TabButton
            active={activeTab === 'youtube'}
            onClick={() => setActiveTab('youtube')}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            }
            count={results.youtube?.links.length || 0}
          >
            유튜브
          </TabButton>
          <TabButton
            active={activeTab === 'news'}
            onClick={() => setActiveTab('news')}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
                <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
              </svg>
            }
            count={results.naverNews?.links.length || 0}
          >
            뉴스
          </TabButton>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="transition-all duration-300">
        {activeTab === 'blog' && (
          <ResultSection 
            title="네이버 블로그 분석" 
            data={results.naverBlog} 
            showAnalysisButton={true}
            searchKeyword={searchKeyword}
            analysisType="blog"
          />
        )}
        {activeTab === 'cafe' && (
          <ResultSection 
            title="네이버 카페 분석" 
            data={results.naverCafe}
            showAnalysisButton={true}
            searchKeyword={searchKeyword}
            analysisType="cafe"
          />
        )}
        {activeTab === 'youtube' && (
          <ResultSection 
            title="유튜브 콘텐츠 분석" 
            data={results.youtube}
            showAnalysisButton={true}
            searchKeyword={searchKeyword}
            analysisType="youtube"
          />
        )}
        {activeTab === 'news' && (
          <ResultSection 
            title="네이버 뉴스 분석" 
            data={results.naverNews}
            showAnalysisButton={true}
            searchKeyword={searchKeyword}
            analysisType="news"
          />
        )}
      </div>
    </div>
  );
};

export default SearchResults; 