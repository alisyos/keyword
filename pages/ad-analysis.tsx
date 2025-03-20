import React, { useState } from 'react';
import Head from 'next/head';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';

// 결과 타입 정의
interface AdAnalysisResult {
  ourAd: {
    rank: number;
    evaluation: {
      title: string;
      description: string;
    };
  };
  competitorAnalysis: string;
  adSuggestions: Array<{
    title: string;
    description: string;
    improvementPoints: string;
  }>;
}

export default function AdAnalysis() {
  // 상태 관리
  const [keyword, setKeyword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ourAd' | 'competitors' | 'suggestions'>('ourAd');

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      if (!selectedFile.type.includes('image')) {
        setError('이미지 파일만 업로드 가능합니다.');
        setFile(null);
        setImagePreview(null);
        return;
      }
      
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setError(null);
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!keyword) {
      setError('검색 키워드를 입력해주세요.');
      return;
    }
    
    if (!companyName) {
      setError('업체명을 입력해주세요.');
      return;
    }
    
    if (!file) {
      setError('광고 검색결과 캡처 이미지를 업로드해주세요.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 이미지 파일과 함께 폼 데이터 생성
      const formData = new FormData();
      formData.append('keyword', keyword);
      formData.append('companyName', companyName);
      formData.append('image', file);
      
      // API 요청
      const response = await axios.post('/api/ad-analysis', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setResult(response.data);
    } catch (err: any) {
      console.error('광고 분석 중 오류 발생:', err);
      setError(err.response?.data?.error || '광고 분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Head>
        <title>광고 경쟁력 분석 | GPTKOREA 키워드 분석 서비스</title>
        <meta name="description" content="광고 검색결과 캡처 이미지를 분석하여 광고 경쟁력을 진단하고 개선안을 제시합니다." />
      </Head>
      
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* 헤더 섹션 - 키워드 분석 페이지와 스타일 통일 */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
            광고 경쟁력 분석
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            광고 검색결과 캡처 이미지를 업로드하여 경쟁력을 분석하고 
            <br className="hidden md:block" />
            구체적인 개선 방안을 받아보세요.
          </p>
        </div>
      
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* 폼 섹션 - 항상 표시 */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-1">
                    검색 키워드 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="keyword"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="예: 다이어트 도시락"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                    귀사 업체명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="예: 건강한끼"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  광고 검색결과 캡처 이미지 <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <div className="mb-4">
                        <img
                          src={imagePreview}
                          alt="광고 캡처 미리보기"
                          className="mx-auto h-64 object-contain rounded"
                        />
                      </div>
                    ) : (
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                      >
                        <span>이미지 파일 선택</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">또는 여기로 끌어오세요</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF 최대 10MB
                    </p>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-3 ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                  } text-white font-semibold rounded-lg shadow-md transition-all flex items-center space-x-2`}
                >
                  {loading && (
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{loading ? '분석 중...' : '광고 분석하기'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 결과 섹션 - 결과가 있을 때만 표시 */}
        {result && (
          <div className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-5">
              <h1 className="text-2xl sm:text-3xl font-bold">
                "{keyword}"
              </h1>
              <p className="mt-1 opacity-90">
                광고 경쟁력 분석 결과
              </p>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="text-red-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-lg text-gray-700">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-6 px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  다시 시도
                </button>
              </div>
            ) : (
              <div>
                {/* 탭 네비게이션 */}
                <div className="border-b border-gray-200 overflow-x-auto">
                  <nav className="flex -mb-px whitespace-nowrap">
                    <button
                      className={`px-6 py-3 border-b-2 font-medium text-sm sm:text-base transition-colors ${
                        activeTab === 'ourAd'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTab('ourAd')}
                    >
                      자사 광고 분석
                    </button>
                    <button
                      className={`px-6 py-3 border-b-2 font-medium text-sm sm:text-base transition-colors ${
                        activeTab === 'competitors'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTab('competitors')}
                    >
                      경쟁사 분석
                    </button>
                    <button
                      className={`px-6 py-3 border-b-2 font-medium text-sm sm:text-base transition-colors ${
                        activeTab === 'suggestions'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTab('suggestions')}
                    >
                      광고 소재 제안
                    </button>
                  </nav>
                </div>

                {/* 탭 컨텐츠 */}
                <div className="p-6">
                  {activeTab === 'ourAd' && (
                    <div>
                      <h2 className="text-xl font-semibold mb-6">자사 광고 분석</h2>
                      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                        <div className="p-5">
                          {/* 현재 광고 순위 */}
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-medium text-gray-900">현재 광고 순위</h3>
                              <div className="flex items-center">
                                <div className="bg-blue-100 text-blue-800 text-lg font-bold rounded-full w-12 h-12 flex items-center justify-center">
                                  {result.ourAd.rank || "?"}
                                </div>
                              </div>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <p className="text-gray-700">
                                <span className="font-semibold">{companyName}</span>의 광고는
                                {result.ourAd.rank > 0 
                                  ? <span> 검색 결과 <span className="font-bold text-blue-700">{result.ourAd.rank}위</span>에 노출되고 있습니다.</span>
                                  : <span> 검색 결과에서 <span className="font-bold text-red-600">발견되지 않았습니다.</span></span>
                                }
                              </p>
                            </div>
                          </div>
                          
                          {/* 광고 평가 */}
                          <div>
                            <h3 className="font-medium text-gray-900 mb-3">광고 평가</h3>
                            <div className="space-y-4">
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">광고 제목</h4>
                                <p className="text-gray-600 pl-3 border-l-2 border-blue-400">
                                  {result.ourAd.evaluation.title}
                                </p>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">광고 설명</h4>
                                <p className="text-gray-600 pl-3 border-l-2 border-blue-400">
                                  {result.ourAd.evaluation.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'competitors' && (
                    <div>
                      <h2 className="text-xl font-semibold mb-6">경쟁사 광고 분석</h2>
                      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                        <div className="p-5">
                          <div className="text-gray-700 whitespace-pre-line">
                            {result.competitorAnalysis.split('\n').map((line, index) => {
                              // 번호로 시작하는 줄 (예: 1. [회사명] - 내용)은 경쟁사 항목으로 처리
                              if (/^\d+\./.test(line)) {
                                const [num, rest] = line.split('. ', 2);
                                if (rest) {
                                  const [company, analysis] = rest.split(' - ', 2);
                                  return (
                                    <div key={index} className="mb-4 pb-4 border-b border-gray-100 last:border-b-0">
                                      <div className="flex items-start mb-2">
                                        <div className="bg-indigo-100 text-indigo-800 font-semibold rounded-full w-7 h-7 flex items-center justify-center mr-2">
                                          {num}
                                        </div>
                                        <h3 className="font-medium text-gray-900">{company}</h3>
                                      </div>
                                      <p className="text-gray-600 pl-9">{analysis}</p>
                                    </div>
                                  );
                                }
                              }
                              return <p key={index} className="mb-2">{line}</p>;
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'suggestions' && (
                    <div>
                      <h2 className="text-xl font-semibold mb-6">광고 소재 제안</h2>
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                        {result.adSuggestions.map((suggestion, index) => (
                          <div 
                            key={index} 
                            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transform transition-all hover:-translate-y-1 hover:shadow-md"
                          >
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-2 px-4">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-white">광고 소재 #{index + 1}</span>
                              </div>
                            </div>
                            <div className="p-5">
                              <div className="mb-4">
                                <h3 className="font-semibold text-lg text-gray-800 mb-1">제목</h3>
                                <p className="bg-blue-50 p-3 rounded-md text-gray-800">{suggestion.title}</p>
                              </div>
                              <div className="mb-4">
                                <h3 className="font-semibold text-lg text-gray-800 mb-1">설명</h3>
                                <p className="bg-blue-50 p-3 rounded-md text-gray-800">{suggestion.description}</p>
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-700 mb-1 text-sm">개선 포인트</h3>
                                <p className="text-gray-600 pl-3 border-l-2 border-blue-400 py-1">
                                  {suggestion.improvementPoints}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-8 text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                        <p className="mb-1">* 위 광고 소재는 수집된 데이터와 분석 결과를 기반으로 AI가 생성한 추천 소재입니다.</p>
                        <p className="mb-1">* 실제 사용 전 검토와 수정이 필요할 수 있습니다.</p>
                        <p>* 키워드, 타겟 고객, 마케팅 목표에 따라 광고 소재를 조정하세요.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
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