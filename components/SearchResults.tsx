import React from 'react';

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
  };
  searchKeyword: string;
}

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
  analysisType?: 'blog' | 'cafe' | 'youtube';
}) => {
  if (!data) return null;

  const handleOpenAnalysis = () => {
    window.open(`/keyword-analysis?keyword=${encodeURIComponent(searchKeyword || '')}&type=${analysisType}`, '_blank', 'width=800,height=600');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {showAnalysisButton && searchKeyword && (
          <button
            onClick={handleOpenAnalysis}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm"
          >
            세부 분석
          </button>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">요약</h3>
        <p className="text-gray-700 whitespace-pre-line">{data.summary}</p>
      </div>
      
      {data.links && data.links.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">관련 링크</h3>
          <ul className="list-none space-y-4">
            {data.links.map((link, index) => (
              <li key={index} className="border-b border-gray-100 pb-3">
                <a 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium block mb-1"
                >
                  {link.title}
                </a>
                {link.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{link.description}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const SearchResults: React.FC<SearchResultsProps> = ({ results, searchKeyword }) => {
  const hasResults = results.naverBlog || results.naverCafe || results.youtube;

  if (!hasResults) return null;

  return (
    <div>
      <ResultSection 
        title="네이버 블로그 결과" 
        data={results.naverBlog} 
        showAnalysisButton={true}
        searchKeyword={searchKeyword}
        analysisType="blog"
      />
      <ResultSection 
        title="네이버 카페 결과" 
        data={results.naverCafe}
        showAnalysisButton={true}
        searchKeyword={searchKeyword}
        analysisType="cafe"
      />
      <ResultSection 
        title="유튜브 결과" 
        data={results.youtube}
        showAnalysisButton={true}
        searchKeyword={searchKeyword}
        analysisType="youtube"
      />
    </div>
  );
};

export default SearchResults; 