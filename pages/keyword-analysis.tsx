import { useState, useEffect } from 'react';
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
  positiveKeywords: Array<{keyword: string, score: number}>;
  negativeKeywords: Array<{keyword: string, score: number}>;
}

interface AdSuggestion {
  headline: string;
  description: string;
  target: string;
}

interface AnalysisResult {
  keywords: KeywordData[];
  sentiment?: SentimentData;
  adSuggestions?: AdSuggestion[];
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
  const total = positive + negative + neutral;
  const positivePercent = Math.round((positive / total) * 100) || 0;
  const negativePercent = Math.round((negative / total) * 100) || 0;
  const neutralPercent = Math.round((neutral / total) * 100) || 0;

  // 도넛 차트 계산
  const positiveOffset = 0;
  const negativeOffset = positivePercent;
  const neutralOffset = positivePercent + negativePercent;

  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="relative w-48 h-48">
        {/* 도넛 차트 SVG */}
        <svg viewBox="0 0 36 36" className="w-full h-full">
          <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#e5e7eb" strokeWidth="3"></circle>
          
          {/* 긍정 부분 */}
          {positivePercent > 0 && (
            <circle 
              cx="18" 
              cy="18" 
              r="15.91549430918954" 
              fill="transparent" 
              stroke="#34d399" 
              strokeWidth="3" 
              strokeDasharray={`${positivePercent} ${100-positivePercent}`} 
              strokeDashoffset={25}
            ></circle>
          )}
          
          {/* 부정 부분 */}
          {negativePercent > 0 && (
            <circle 
              cx="18" 
              cy="18" 
              r="15.91549430918954" 
              fill="transparent" 
              stroke="#ef4444" 
              strokeWidth="3" 
              strokeDasharray={`${negativePercent} ${100-negativePercent}`} 
              strokeDashoffset={25 - positivePercent}
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
            ></circle>
          )}
        </svg>
      </div>
      
      {/* 범례 */}
      <div className="flex flex-wrap justify-center mt-4 gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-400 rounded-full mr-2"></div>
          <span className="text-sm">긍정 {positivePercent}%</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
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
  const [analysisData, setAnalysisData] = useState<AnalysisResult>({ keywords: [], contentType: 'blog' });
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
  
  async function handleAnalyzeClick() {
    if (!keyword) {
      setError('검색어를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/keyword-analysis', {
        keyword,
        contentType: type
      });
      setAnalysisData(response.data);
    } catch (err) {
      console.error('Error fetching analysis data:', err);
      setError('분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

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
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-2">
          "{keyword}" 키워드 상세 분석
        </h1>
        <p className="text-center text-gray-600 mb-8">
          {getContentTypeTitle()} 콘텐츠 기반
        </p>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        ) : (
          <div>
            {/* 탭 버튼 */}
            <div className="flex border-b border-gray-200 mb-4 overflow-x-auto whitespace-nowrap pb-1">
              <TabButton
                active={activeTab === 'keywords'}
                onClick={() => setActiveTab('keywords')}
              >
                키워드 빈도 분석
              </TabButton>
              <TabButton
                active={activeTab === 'sentiment'}
                onClick={() => setActiveTab('sentiment')}
              >
                감정 분석
              </TabButton>
              <TabButton
                active={activeTab === 'adSuggestions'}
                onClick={() => setActiveTab('adSuggestions')}
              >
                광고 제안
              </TabButton>
            </div>

            {/* 탭 내용 */}
            <div className="bg-white shadow-md rounded-lg p-6">
              {activeTab === 'keywords' && (
                <>
                  <h2 className="text-xl font-semibold mb-4">언급 빈도가 높은 상위 키워드</h2>
                  
                  {analysisData.keywords.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">분석할 키워드가 충분하지 않습니다.</p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                순위
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                키워드
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                언급 빈도
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                빈도 시각화
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {analysisData.keywords.map((item, index) => {
                              // 최대 빈도수에 대한 비율 계산
                              const maxFrequency = analysisData.keywords[0].frequency;
                              const ratio = item.frequency / maxFrequency;
                              
                              return (
                                <tr key={index}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {index + 1}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.keyword}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.frequency}회
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div 
                                        className="h-4 bg-blue-500 rounded"
                                        style={{ width: `${ratio * 100}%` }}
                                      ></div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-8 text-sm text-gray-500">
                        <p>* 네이버 블로그 검색 결과의 제목과 내용을 분석하여 추출한 결과입니다.</p>
                        <p>* 불용어 및 특수문자, 숫자는 제외되었습니다.</p>
                      </div>
                    </>
                  )}
                </>
              )}

              {activeTab === 'sentiment' && analysisData.sentiment && (
                <>
                  <h2 className="text-xl font-semibold mb-4">감정 분석 결과</h2>
                  
                  {/* 도넛 차트 */}
                  <DonutChart 
                    positive={analysisData.sentiment.positive} 
                    negative={analysisData.sentiment.negative} 
                    neutral={analysisData.sentiment.neutral} 
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {/* 긍정 키워드 테이블 */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-green-600">긍정적 키워드</h3>
                      {analysisData.sentiment.positiveKeywords.length === 0 ? (
                        <p className="text-gray-500">긍정 키워드가 발견되지 않았습니다.</p>
                      ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                키워드
                              </th>
                              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                점수
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {analysisData.sentiment.positiveKeywords.map((item, index) => (
                              <tr key={index}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {item.keyword}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                  <div className="flex items-center">
                                    <span className="mr-2 text-gray-500">{item.score}</span>
                                    <div 
                                      className="h-3 bg-green-400 rounded"
                                      style={{ width: `${(item.score / 10) * 100}%` }}
                                    ></div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* 부정 키워드 테이블 */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-red-600">부정적 키워드</h3>
                      {analysisData.sentiment.negativeKeywords.length === 0 ? (
                        <p className="text-gray-500">부정 키워드가 발견되지 않았습니다.</p>
                      ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                키워드
                              </th>
                              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                점수
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {analysisData.sentiment.negativeKeywords.map((item, index) => (
                              <tr key={index}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {item.keyword}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                  <div className="flex items-center">
                                    <span className="mr-2 text-gray-500">{item.score}</span>
                                    <div 
                                      className="h-3 bg-red-400 rounded"
                                      style={{ width: `${(item.score / 10) * 100}%` }}
                                    ></div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-8 text-sm text-gray-500">
                    <p>* AI를 통한 감정 분석 결과로, 실제 맥락과 다를 수 있습니다.</p>
                    <p>* 점수는 1-10 사이로, 높을수록 더 강한 감정을 나타냅니다.</p>
                  </div>
                </>
              )}

              {activeTab === 'adSuggestions' && (
                <>
                  <h2 className="text-xl font-semibold mb-4">키워드 광고 소재 제안</h2>
                  
                  {generating ? (
                    <div className="text-center py-8">
                      <div className="animate-pulse mb-4">
                        <div className="h-10 w-10 mx-auto bg-blue-200 rounded-full"></div>
                      </div>
                      <p className="text-gray-500">광고 소재를 생성 중입니다...</p>
                      <p className="text-sm text-gray-400 mt-2">처음 생성 시 시간이 소요될 수 있습니다.</p>
                    </div>
                  ) : (
                    <>
                      {!analysisData.adSuggestions || analysisData.adSuggestions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-10">
                          <p className="text-gray-600 text-center text-lg">
                            생성된 광고 소재가 없습니다.
                            <br />
                            아래 버튼을 클릭하여 광고 소재를 생성해보세요.
                          </p>
                          <button
                            onClick={handleGenerateAdSuggestions}
                            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md shadow-md transition-all flex items-center space-x-2"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z"></path>
                            </svg>
                            <span>광고 소재 생성하기</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {analysisData.adSuggestions.map((ad, index) => (
                              <div key={index} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="text-lg font-semibold text-blue-600 mb-2">
                                  {ad.headline}
                                </h3>
                                <p className="text-gray-700 mb-3">
                                  {ad.description}
                                </p>
                                <p className="text-sm text-gray-500">
                                  타겟: {ad.target}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-center mt-6">
                            <button
                              onClick={handleGenerateAdSuggestions}
                              className="bg-white hover:bg-gray-50 text-blue-600 border border-blue-600 font-medium py-2 px-4 rounded-md flex items-center space-x-2 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z"></path>
                              </svg>
                              <span>새로운 광고 소재 생성하기</span>
                            </button>
                          </div>
                          <div className="mt-8 text-sm text-gray-500">
                            <p>* 위 광고 소재는 수집된 데이터와 분석 결과를 기반으로 AI가 생성한 추천 소재입니다.</p>
                            <p>* 실제 사용 전 검토와 수정이 필요할 수 있습니다.</p>
                            <p>* 키워드, 타겟 고객, 마케팅 목표에 따라 광고 소재를 조정하세요.</p>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-8 text-center">
          <button
            onClick={() => window.close()}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            창 닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeywordAnalysis; 