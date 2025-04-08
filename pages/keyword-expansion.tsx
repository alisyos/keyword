import React, { useState } from 'react';
import Head from 'next/head';
import axios from 'axios';
import { marked } from 'marked';

interface KeywordData {
  relKeyword: string;
  monthlyPcQcCnt: string;
  monthlyMobileQcCnt: string;
  monthlyAvePcClkCnt: string;
  monthlyAveMobileClkCnt: string;
  monthlyAvePcCtr: string;
  monthlyAveMobileCtr: string;
  plAvgDepth: string;
  compIdx: string;
}

interface SearchResult {
  keyword: string;
  timestamp: string;
  status: string;
  keywordList: KeywordData[];
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc' | null;
}

export default function KeywordExpansion() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null });
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [userQuery, setUserQuery] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!keyword.trim()) {
      setError('키워드를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const response = await axios.post('/api/keyword-expansion', {
        keyword: keyword.trim()
      });
      
      setResult(response.data.data);
    } catch (err) {
      console.error('Error:', err);
      setError('키워드 확장 데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: string) => {
    if (value === '<10') return value;
    return Number(value).toLocaleString();
  };

  const formatPercentage = (value: string) => {
    if (value === '0') return '0%';
    return `${Number(value).toFixed(2)}%`;
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }
    
    setSortConfig({ key, direction });
  };

  const getSortedKeywordList = () => {
    if (!sortConfig.direction) {
      return result?.keywordList || [];
    }

    return [...(result?.keywordList || [])].sort((a, b) => {
      if (a[sortConfig.key] === null) return 1;
      if (b[sortConfig.key] === null) return -1;
      
      if (sortConfig.key === 'compIdx') {
        const order = { 'HIGH': 3, 'MIDDLE': 2, 'LOW': 1 };
        return sortConfig.direction === 'asc' 
          ? order[a[sortConfig.key]] - order[b[sortConfig.key]]
          : order[b[sortConfig.key]] - order[a[sortConfig.key]];
      }
      
      return sortConfig.direction === 'asc'
        ? a[sortConfig.key] > b[sortConfig.key] ? 1 : -1
        : b[sortConfig.key] > a[sortConfig.key] ? 1 : -1;
    });
  };

  const renderSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
      return <span className="ml-1 text-gray-400">↕</span>;
    }
    return sortConfig.direction === 'asc' ? (
      <span className="ml-1 text-blue-600">↑</span>
    ) : sortConfig.direction === 'desc' ? (
      <span className="ml-1 text-blue-600">↓</span>
    ) : (
      <span className="ml-1 text-gray-400">↕</span>
    );
  };

  const renderTableHeader = (field: string, label: string, isMultiLine: boolean = false) => {
    const labelContent = isMultiLine ? (
      <div className="flex flex-col items-center gap-1">
        {label.split('\n').map((part, index) => (
          <span key={index}>{part}</span>
        ))}
      </div>
    ) : (
      <span>{label}</span>
    );

    return (
      <th 
        scope="col" 
        className={`px-6 py-4 text-sm font-semibold text-gray-900 cursor-pointer hover:bg-blue-100/50 ${
          field === 'relKeyword' ? 'text-left' : 'text-center'
        }`}
        onClick={() => handleSort(field)}
      >
        <div className={`flex ${field === 'relKeyword' ? '' : 'justify-center'} items-center gap-1`}>
          {labelContent}
          {renderSortIcon(field)}
        </div>
      </th>
    );
  };

  const handleAnalyze = async () => {
    if (!userQuery.trim()) {
      alert('분석을 위한 질문을 입력해주세요.');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywordData: getSortedKeywordList(),
          userQuery: userQuery,
        }),
      });

      if (!response.ok) {
        throw new Error('분석 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setShowAnalysis(true);
    } catch (error) {
      setError('AI 분석 중 오류가 발생했습니다.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Head>
        <title>키워드 확장 | 키워드 인사이트</title>
        <meta name="description" content="네이버 검색광고 API를 활용한 연관 키워드 확장 도구" />
      </Head>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        {/* 헤더 섹션 */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
            키워드 확장
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            입력한 키워드와 관련된 연관 키워드를 찾아보세요
            <br className="hidden md:block" />
            검색량, 클릭수, 경쟁정도 등 상세 정보를 확인할 수 있습니다.
          </p>
        </div>

        {/* 검색 폼 */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="확장하고 싶은 키워드를 입력하세요"
                    className="flex-1 px-6 py-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 transition-colors font-medium"
                  >
                    {loading ? '검색 중...' : '검색'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
              {error}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : result && (
          <div className="space-y-8">
            {result.keywordList.length > 0 ? (
              <>
                {/* AI 분석 섹션 */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-5">
                    <h2 className="text-xl font-semibold">AI 분석</h2>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      <input
                        type="text"
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        placeholder="분석을 위한 질문을 입력하세요 (예: 핵심 키워드 추려주세요, 시장 분석해주세요)"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className={`px-6 py-3 rounded-lg font-medium text-white shadow-md transition-all ${
                          analyzing
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg'
                        }`}
                      >
                        {analyzing ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            분석 중...
                          </div>
                        ) : 'AI 분석'}
                      </button>
                    </div>

                    {showAnalysis ? (
                      <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 shadow-inner">
                        <div className="prose max-w-none">
                          <div dangerouslySetInnerHTML={{ 
                            __html: marked(analysis, { breaks: true }) 
                          }} />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500">
                        <div className="mb-2 text-blue-500">
                          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <p className="text-lg font-medium">AI에게 질문해보세요</p>
                        <p className="text-sm mt-1">검색량, 클릭수, 경쟁정도 등을 고려한 분석 결과를 확인할 수 있습니다</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 연관 키워드 목록 */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">연관 키워드 목록</h2>
                        <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                          총 {result.keywordList.length}개
                        </span>
                      </div>
                      <div className="text-sm opacity-90">
                        검색키워드: {result.keyword} / 검색 시간: {new Date(result.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                        <tr>
                          {renderTableHeader('relKeyword', '키워드')}
                          {renderTableHeader('monthlyPcQcCnt', 'PC\n검색량', true)}
                          {renderTableHeader('monthlyMobileQcCnt', '모바일\n검색량', true)}
                          {renderTableHeader('monthlyAvePcClkCnt', 'PC\n클릭수', true)}
                          {renderTableHeader('monthlyAveMobileClkCnt', '모바일\n클릭수', true)}
                          {renderTableHeader('monthlyAvePcCtr', 'PC\n클릭율', true)}
                          {renderTableHeader('monthlyAveMobileCtr', '모바일\n클릭율', true)}
                          {renderTableHeader('plAvgDepth', '노출광고\n수', true)}
                          {renderTableHeader('compIdx', '경쟁\n정도', true)}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getSortedKeywordList().map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-left text-gray-900">
                              {item.relKeyword}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                              {formatNumber(item.monthlyPcQcCnt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                              {formatNumber(item.monthlyMobileQcCnt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                              {formatNumber(item.monthlyAvePcClkCnt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                              {formatNumber(item.monthlyAveMobileClkCnt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                              {formatPercentage(item.monthlyAvePcCtr)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                              {formatPercentage(item.monthlyAveMobileCtr)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                              {formatNumber(item.plAvgDepth)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${
                                item.compIdx === 'HIGH' ? 'bg-red-100 text-red-800' :
                                item.compIdx === 'MID' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {item.compIdx === 'HIGH' ? '높음' :
                                 item.compIdx === 'MID' ? '보통' : '낮음'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium">연관 키워드가 없습니다</p>
                  <p className="text-sm mt-1">다른 키워드로 다시 검색해보세요</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* 푸터 */}
      <footer className="mt-16 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-gray-600 text-sm">
            <p>© 2025 GPTKOREA 키워드 분석 서비스. All rights reserved.</p>
            <p className="mt-2">네이버와 유튜브 검색 데이터를 활용한 키워드 분석 서비스입니다.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 