import React, { useState } from 'react';
import Head from 'next/head';
import axios from 'axios';

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

type SortField = keyof KeywordData;
type SortOrder = 'asc' | 'desc';

export default function KeywordExpansion() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [sortField, setSortField] = useState<SortField>('relKeyword');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortedKeywordList = () => {
    if (!result?.keywordList) return [];
    
    return [...result.keywordList].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // 숫자 필드의 경우 숫자로 변환하여 비교
      if (['monthlyPcQcCnt', 'monthlyMobileQcCnt', 'monthlyAvePcClkCnt', 'monthlyAveMobileClkCnt', 'plAvgDepth'].includes(sortField)) {
        aValue = aValue === '<10' ? '0' : aValue;
        bValue = bValue === '<10' ? '0' : bValue;
        return sortOrder === 'asc' ? 
          Number(aValue) - Number(bValue) : 
          Number(bValue) - Number(aValue);
      }
      
      // 퍼센트 필드의 경우 숫자로 변환하여 비교
      if (['monthlyAvePcCtr', 'monthlyAveMobileCtr'].includes(sortField)) {
        return sortOrder === 'asc' ? 
          Number(aValue) - Number(bValue) : 
          Number(bValue) - Number(aValue);
      }
      
      // 경쟁도의 경우 HIGH > MID > LOW 순서로 정렬
      if (sortField === 'compIdx') {
        const order = { HIGH: 3, MID: 2, LOW: 1 };
        const aOrder = order[aValue as keyof typeof order] || 0;
        const bOrder = order[bValue as keyof typeof order] || 0;
        return sortOrder === 'asc' ? 
          aOrder - bOrder : 
          bOrder - aOrder;
      }
      
      // 문자열 필드의 경우 문자열 비교
      return sortOrder === 'asc' ? 
        aValue.localeCompare(bValue) : 
        bValue.localeCompare(aValue);
    });
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const renderTableHeader = (field: SortField, label: string) => (
    <th 
      className="group px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gradient-to-b from-gray-50 to-gray-100 z-10 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {renderSortIcon(field)}
      </div>
    </th>
  );

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
                        <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">
                          키워드
                        </th>
                        <th scope="col" className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                          PC<br/>검색량
                        </th>
                        <th scope="col" className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                          모바일<br/>검색량
                        </th>
                        <th scope="col" className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                          PC<br/>클릭수
                        </th>
                        <th scope="col" className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                          모바일<br/>클릭수
                        </th>
                        <th scope="col" className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                          PC<br/>클릭율
                        </th>
                        <th scope="col" className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                          모바일<br/>클릭율
                        </th>
                        <th scope="col" className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                          노출광고<br/>수
                        </th>
                        <th scope="col" className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                          경쟁<br/>정도
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getSortedKeywordList().map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.relKeyword}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                            {formatNumber(item.monthlyPcQcCnt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                            {formatNumber(item.monthlyMobileQcCnt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900 font-medium">{formatNumber(item.monthlyAvePcClkCnt)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900 font-medium">{formatNumber(item.monthlyAveMobileClkCnt)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900 font-medium">{formatPercentage(item.monthlyAvePcCtr)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900 font-medium">{formatPercentage(item.monthlyAveMobileCtr)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900 font-medium">{formatNumber(item.plAvgDepth)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
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