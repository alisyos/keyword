import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Box, CircularProgress, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { AutoAwesomeIcon } from '@mui/icons-material';

interface KeywordData {
  keyword: string;
  frequency: number;
}

interface SentimentData {
  positive: number;
  negative: number;
  neutral: number;
  positiveKeywords: Array<{ keyword: string; score: number }>;
  negativeKeywords: Array<{ keyword: string; score: number }>;
}

interface AdSuggestion {
  headline: string;
  description: string;
  target: string;
}

interface KeywordAnalysisResult {
  keywords: KeywordData[];
  sentiment?: SentimentData;
  adSuggestions?: Array<AdSuggestion>;
  contentType?: string;
}

// 탭 버튼 컴포넌트
const TabButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
        active 
          ? 'bg-white text-indigo-600 border-t border-l border-r border-gray-200' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
};

// 도넛 차트 컴포넌트
const DonutChart = ({ positive, negative, neutral }: { positive: number; negative: number; neutral: number }) => {
  // 백분율 계산
  const total = positive + negative + neutral;
  const positivePercent = Math.round((positive / total) * 100) || 0;
  const negativePercent = Math.round((negative / total) * 100) || 0;
  const neutralPercent = Math.round((neutral / total) * 100) || 0;
  
  // 차트 설정
  const circleSize = 120;
  const strokeWidth = 12;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // 각 부분의 길이 계산
  const positiveLength = (positivePercent / 100) * circumference;
  const negativeLength = (negativePercent / 100) * circumference;
  const neutralLength = (neutralPercent / 100) * circumference;
  
  // 각 부분의 시작 위치 계산
  const positiveOffset = 0;
  const negativeOffset = positiveLength;
  const neutralOffset = positiveLength + negativeLength;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full" viewBox="0 0 36 36">
          {/* 긍정 부분 */}
          <circle 
            cx="18" 
            cy="18" 
            r="15.91549430918954" 
            fill="transparent" 
            stroke="#4ade80" 
            strokeWidth="3" 
            strokeDasharray={`${positivePercent} ${100-positivePercent}`} 
            strokeDashoffset={25}
            className="transition-all duration-1000 ease-out"
          ></circle>
          
          {/* 부정 부분 */}
          {negativePercent > 0 && (
            <circle 
              cx="18" 
              cy="18" 
              r="15.91549430918954" 
              fill="transparent" 
              stroke="#f87171" 
              strokeWidth="3" 
              strokeDasharray={`${negativePercent} ${100-negativePercent}`} 
              strokeDashoffset={25 - positivePercent}
              className="transition-all duration-1000 ease-out"
            ></circle>
          )}
          
          {/* 중립 부분 */}
          {neutralPercent > 0 && (
            <circle 
              cx="18" 
              cy="18" 
              r="15.91549430918954" 
              fill="transparent" 
              stroke="#9ca3af" 
              strokeWidth="3" 
              strokeDasharray={`${neutralPercent} ${100-neutralPercent}`} 
              strokeDashoffset={25 - (positivePercent + negativePercent)}
              className="transition-all duration-1000 ease-out"
            ></circle>
          )}
          
          {/* 가운데 텍스트 */}
          <g className="chart-text">
            <text x="18" y="16" className="chart-number" textAnchor="middle" alignmentBaseline="central" fontSize="5" fontWeight="bold">
              {positivePercent}%
            </text>
            <text x="18" y="21" className="chart-label" textAnchor="middle" alignmentBaseline="central" fontSize="2.5">
              긍정적
            </text>
          </g>
        </svg>
      </div>
      
      {/* 범례 */}
      <div className="flex flex-wrap justify-center mt-4 gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-400 rounded-full mr-2"></div>
          <span className="text-sm">긍정 {positivePercent}%</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-400 rounded-full mr-2"></div>
          <span className="text-sm">부정 {negativePercent}%</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-400 rounded-full mr-2"></div>
          <span className="text-sm">중립 {neutralPercent}%</span>
        </div>
      </div>
    </div>
  );
};

// 광고 카드 컴포넌트
const AdCard = ({ ad, index }: { ad: AdSuggestion; index: number }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="bg-indigo-600 py-2 px-4">
        <span className="text-xs font-medium text-white">광고 소재 #{index + 1}</span>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{ad.headline}</h3>
        <p className="text-sm text-gray-600 mb-4">{ad.description}</p>
        <div className="flex items-center text-xs text-gray-500">
          <span className="font-medium mr-2">타겟 고객:</span>
          <span>{ad.target}</span>
        </div>
      </div>
    </div>
  );
};

const KeywordAnalysis = () => {
  const router = useRouter();
  const { keyword, type = 'blog' } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analysisData, setAnalysisData] = useState<KeywordAnalysisResult>({ keywords: [], contentType: 'blog' });
  const [activeTab, setActiveTab] = useState<'keywords' | 'sentiment' | 'adSuggestions'>('keywords');
  const [generating, setGenerating] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchKeywordAnalysis = async () => {
      if (!keyword) return;
      
      try {
        setLoading(true);
        setError('');
        
        const response = await axios.post('/api/keyword-analysis', { 
          keyword,
          contentType: type 
        });
        setAnalysisData(response.data);
      } catch (err) {
        console.error('키워드 분석 요청 중 오류:', err);
        setError('키워드 분석을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchKeywordAnalysis();
  }, [keyword, type]);
  
  // 콘텐츠 유형에 따른 제목 생성
  const getContentTypeTitle = () => {
    switch(type) {
      case 'blog': return '네이버 블로그';
      case 'cafe': return '네이버 카페';
      case 'youtube': return '유튜브';
      default: return '콘텐츠';
    }
  };
  
  async function handleGenerateAdSuggestions() {
    if (!keyword) {
      setError('검색어를 입력해주세요.');
      return;
    }

    setGenerating(true);
    try {
      const response = await axios.post('/api/generate-ad-suggestions', {
        keyword,
        contentType: type
      });
      setAnalysisData(prev => 
        prev ? { ...prev, adSuggestions: response.data.adSuggestions } : null
      );
    } catch (err) {
      console.error('Error generating ad suggestions:', err);
      setError('광고 제안 생성 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Head>
        <title>"{keyword}" 키워드 분석 | 키워드 인사이트</title>
        <meta name="description" content={`${keyword} 키워드에 대한 상세 분석 결과`} />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </Head>
      
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-5">
            <h1 className="text-2xl sm:text-3xl font-bold">
              "{keyword}"
            </h1>
            <p className="mt-1 opacity-90">
              {getContentTypeTitle()} 키워드 상세 분석
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
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    className={`px-6 py-3 border-b-2 font-medium text-sm sm:text-base transition-colors ${
                      activeTab === 'keywords'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('keywords')}
                  >
                    키워드 빈도
                  </button>
                  <button
                    className={`px-6 py-3 border-b-2 font-medium text-sm sm:text-base transition-colors ${
                      activeTab === 'sentiment'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('sentiment')}
                  >
                    감정 분석
                  </button>
                  <button
                    className={`px-6 py-3 border-b-2 font-medium text-sm sm:text-base transition-colors ${
                      activeTab === 'adSuggestions'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('adSuggestions')}
                  >
                    광고 제안
                  </button>
                </nav>
              </div>

              {/* 탭 컨텐츠 */}
              <div className="p-6">
                {activeTab === 'keywords' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">키워드 빈도 분석</h2>
                    {analysisData.keywords && analysisData.keywords.length > 0 ? (
                      <div className="overflow-hidden">
                        <div className="space-y-4">
                          {analysisData.keywords.slice(0, 10).map((item, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3 transition-all hover:shadow-md">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium truncate">{item.keyword}</span>
                                <span className="text-sm font-semibold text-blue-600">{item.frequency}회</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                                  style={{ 
                                    width: `${(item.frequency / analysisData.keywords[0].frequency) * 100}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-6 text-sm text-gray-500">
                          <p className="mb-1">* 분석된 콘텐츠에서 가장 많이 언급된 키워드를 추출했습니다.</p>
                          <p>* 빈도수는 해당 키워드가 콘텐츠 전체에서 등장한 횟수입니다.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-gray-500">분석할 키워드 데이터가 없습니다.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'sentiment' && analysisData.sentiment && (
                  <div>
                    <h2 className="text-xl font-semibold mb-6">감정 분석 결과</h2>
                    
                    <div className="mb-10">
                      <DonutChart 
                        positive={analysisData.sentiment.positive} 
                        negative={analysisData.sentiment.negative} 
                        neutral={analysisData.sentiment.neutral} 
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                      {/* 긍정 키워드 카드 */}
                      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                        <div className="bg-green-50 px-4 py-3 border-b border-green-100">
                          <h3 className="font-semibold text-green-800">긍정적 키워드</h3>
                        </div>
                        <div className="p-4">
                          {analysisData.sentiment.positiveKeywords.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">긍정 키워드가 발견되지 않았습니다.</p>
                          ) : (
                            <div className="space-y-3">
                              {analysisData.sentiment.positiveKeywords.map((item, index) => (
                                <div key={index} className="flex items-center justify-between">
                                  <span className="text-gray-800">{item.keyword}</span>
                                  <div className="flex items-center">
                                    <span className="text-xs text-gray-500 mr-2">{item.score}</span>
                                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                      <div 
                                        className="bg-green-400 h-1.5 rounded-full" 
                                        style={{ width: `${(item.score / 10) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 부정 키워드 카드 */}
                      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                        <div className="bg-red-50 px-4 py-3 border-b border-red-100">
                          <h3 className="font-semibold text-red-800">부정적 키워드</h3>
                        </div>
                        <div className="p-4">
                          {analysisData.sentiment.negativeKeywords.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">부정 키워드가 발견되지 않았습니다.</p>
                          ) : (
                            <div className="space-y-3">
                              {analysisData.sentiment.negativeKeywords.map((item, index) => (
                                <div key={index} className="flex items-center justify-between">
                                  <span className="text-gray-800">{item.keyword}</span>
                                  <div className="flex items-center">
                                    <span className="text-xs text-gray-500 mr-2">{item.score}</span>
                                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                      <div 
                                        className="bg-red-400 h-1.5 rounded-full" 
                                        style={{ width: `${(item.score / 10) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 text-sm text-gray-500">
                      <p className="mb-1">* AI를 통한 감정 분석 결과로, 실제 맥락과 다를 수 있습니다.</p>
                      <p>* 점수는 1-10 사이로, 높을수록 더 강한 감정을 나타냅니다.</p>
                    </div>
                  </div>
                )}

                {activeTab === 'adSuggestions' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-6">키워드 광고 소재 제안</h2>
                    
                    {generating ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="relative w-16 h-16">
                          <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full animate-pulse"></div>
                          <div className="absolute top-0 left-0 w-full h-full border-t-4 border-blue-600 rounded-full animate-spin"></div>
                        </div>
                        <p className="mt-6 text-gray-600 text-center">
                          광고 소재를 생성 중입니다...
                          <br />
                          <span className="text-sm text-gray-500 mt-1 block">처음 생성 시 시간이 소요될 수 있습니다.</span>
                        </p>
                      </div>
                    ) : (
                      <>
                        {!analysisData.adSuggestions || analysisData.adSuggestions.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-800 mb-2 text-center">광고 소재 생성</h3>
                            <p className="text-gray-600 text-center mb-6">
                              분석 결과를 기반으로 맞춤형 광고 소재를 생성합니다.
                              <br />
                              버튼을 클릭하여 시작하세요.
                            </p>
                            <button
                              onClick={handleGenerateAdSuggestions}
                              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                              </svg>
                              광고 소재 생성하기
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                              {analysisData.adSuggestions.map((ad, index) => (
                                <div 
                                  key={index} 
                                  className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transform transition-all hover:-translate-y-1 hover:shadow-md"
                                >
                                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-2 px-4">
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs font-medium text-white opacity-90">광고 소재 #{index + 1}</span>
                                      <span className="text-xs text-white bg-white bg-opacity-20 px-2 py-0.5 rounded">
                                        {ad.target}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="p-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">{ad.headline}</h3>
                                    <p className="text-gray-600 text-sm mb-2">{ad.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-center mt-8">
                              <button
                                onClick={handleGenerateAdSuggestions}
                                className="inline-flex items-center px-5 py-2 border border-blue-600 text-blue-600 font-medium rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                </svg>
                                새로운 광고 소재 생성하기
                              </button>
                            </div>
                            <div className="mt-8 text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                              <p className="mb-1">* 위 광고 소재는 수집된 데이터와 분석 결과를 기반으로 AI가 생성한 추천 소재입니다.</p>
                              <p className="mb-1">* 실제 사용 전 검토와 수정이 필요할 수 있습니다.</p>
                              <p>* 키워드, 타겟 고객, 마케팅 목표에 따라 광고 소재를 조정하세요.</p>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="text-center text-sm text-gray-500 mt-6">
          © 2024 키워드 인사이트 - 모든 콘텐츠 분석 결과는 참고용으로만 사용하세요.
        </div>
      </div>
    </div>
  );
};

export default KeywordAnalysis; 