import { useState } from 'react';
import axios from 'axios';
import SearchResults from '../components/SearchResults';
import Head from 'next/head';

export default function Home() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setError('검색어를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await axios.post('/api/search', { keyword });
      setResults(response.data);
    } catch (err) {
      console.error('검색 중 오류:', err);
      setError('검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Head>
        <title>키워드 분석 서비스</title>
        <meta name="description" content="네이버 블로그, 카페, 유튜브의 콘텐츠를 분석하여 키워드 인사이트를 제공하는 서비스입니다." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* 헤더 섹션 */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
            키워드 분석 서비스
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            네이버 블로그, 카페, 유튜브의 콘텐츠를 실시간으로 분석하여
            <br className="hidden md:block" />
            키워드에 대한 인사이트를 제공해드립니다.
          </p>
        </div>

        {/* 검색 섹션 */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex flex-col md:flex-row gap-4 items-center bg-white rounded-2xl shadow-lg p-2 md:p-3 border border-gray-200">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="분석하고 싶은 키워드를 입력하세요"
                className="w-full px-6 py-4 text-lg rounded-xl border-2 border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                disabled={loading}
              />
              {keyword && (
                <button
                  onClick={() => setKeyword('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>분석 중...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                  <span>분석하기</span>
                </>
              )}
            </button>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* 검색 결과 */}
        {(loading || results) && (
          <div className="transition-all duration-300 ease-in-out">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">키워드를 분석하고 있습니다...</p>
              </div>
            ) : (
              <SearchResults results={results} searchKeyword={keyword} />
            )}
          </div>
        )}

        {/* 서비스 설명 섹션 */}
        {!results && !loading && (
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">실시간 데이터 분석</h3>
              <p className="text-gray-600">네이버와 유튜브의 최신 데이터를 실시간으로 수집하고 분석하여 신뢰도 높은 인사이트를 제공합니다.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">키워드 인사이트</h3>
              <p className="text-gray-600">빈도 분석, 감정 분석을 통해 키워드의 트렌드와 소비자 반응을 심층적으로 파악할 수 있습니다.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">맞춤형 광고 제안</h3>
              <p className="text-gray-600">분석된 데이터를 기반으로 효과적인 광고 문구와 타겟팅 전략을 제안해드립니다.</p>
            </div>
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t border-gray-200 mt-16">
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