import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { OpenAI } from 'openai';

// 네이버 API 설정
const naverClientId = process.env.NAVER_CLIENT_ID;
const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

// YouTube API 설정
const youtubeApiKey = process.env.YOUTUBE_API_KEY;

// OpenAI 인스턴스 생성
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface KeywordData {
  keyword: string;
  frequency: number;
}

interface SentimentData {
  positive: number;
  negative: number;
  neutral: number;
  positiveKeywords: Array<{keyword: string; score: number}>;
  negativeKeywords: Array<{keyword: string; score: number}>;
}

interface ContentItem {
  title: string;
  link: string;
  description: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  score?: number;
  publishedAt?: string;
}

interface AdSuggestion {
  headline: string;
  description: string;
  target: string;
}

interface KeywordAnalysisResult {
  keywords: KeywordData[];
  sentiment?: SentimentData;
  contentType?: string;
  contentItems?: ContentItem[];
  adSuggestions?: AdSuggestion[];
}

// 한국어 텍스트에서 의미 있는 단어 추출 함수
function extractMeaningfulWords(text: string): string[] {
  // 불용어(stopwords) 목록
  const stopwords = [
    '있다', '하다', '되다', '이다', '것', '등', '및', '수', '그', '또', '또는', '이', '그리고',
    '이런', '그런', '저런', '어떤', '무슨', '어느', '한', '이런', '저', '그래서', '하지만',
    '그런데', '그럼에도', '때문에', '위해', '따라서', '인해', '으로', '통해', '이에', '더',
    '덜', '매우', '정말', '너무', '아주', '조금', '거의', '약간', '대략', '어쩌면', '아마',
    '을', '를', '에', '의', '로', '와', '과', '이나', '나', '이나', '도', '만', '까지',
    '부터', '에서', '에게', '으로써', '보다', '처럼', '같이', '대해', '관해', '께서',
    '이라고', '라고', '고', '면서'
  ];

  // 특수문자 및 숫자 제거
  const cleanedText = text.replace(/[^\uAC00-\uD7A3\s]/g, ' ')
                          .replace(/\s+/g, ' ')
                          .trim();
  
  // 단어 추출
  const words = cleanedText.split(' ');
  
  // 불용어 및 짧은 단어 제거
  return words.filter(word => 
    word.length >= 2 && 
    !stopwords.includes(word) && 
    !/^\d+$/.test(word)
  );
}

// 키워드 분석 함수
async function analyzeKeywords(blogItems: any[]): Promise<KeywordAnalysisResult> {
  // HTML 태그 제거 함수
  const removeHtmlTags = (text: string) => text.replace(/<[^>]*>/g, '');
  
  // 전체 텍스트 합치기
  let allText = '';
  
  blogItems.forEach(item => {
    const title = removeHtmlTags(item.title);
    const description = removeHtmlTags(item.description);
    allText += ` ${title} ${description}`;
  });
  
  // 의미 있는 단어 추출
  const words = extractMeaningfulWords(allText);
  
  // 단어 빈도 계산
  const wordFrequency: Record<string, number> = {};
  
  words.forEach(word => {
    if (wordFrequency[word]) {
      wordFrequency[word]++;
    } else {
      wordFrequency[word] = 1;
    }
  });
  
  // 빈도순으로 정렬하여 상위 10개 추출
  const sortedKeywords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword, frequency]) => ({ keyword, frequency }));
  
  return {
    keywords: sortedKeywords
  };
}

// 감정 분석 함수
async function analyzeSentiment(blogItems: any[]): Promise<KeywordAnalysisResult['sentiment']> {
  // HTML 태그 제거 함수
  const removeHtmlTags = (text: string) => text.replace(/<[^>]*>/g, '');
  
  // 전체 텍스트 합치기
  let allText = '';
  
  blogItems.forEach(item => {
    const title = removeHtmlTags(item.title);
    const description = removeHtmlTags(item.description);
    allText += ` ${title} ${description}`;
  });
  
  try {
    // OpenAI를 사용한 감정 분석
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `당신은 텍스트의 감정을 분석하는 전문가입니다. 주어진 텍스트에서 다음 정보를 추출해주세요:
          1. 긍정적, 부정적, 중립적 감정의 비율(%)
          2. 가장 빈번한 긍정적 키워드 5개와 그 점수(1-10)
          3. 가장 빈번한 부정적 키워드 5개와 그 점수(1-10)
          
          응답은 다음 JSON 형식으로 제공해주세요:
          {
            "positive": 숫자,
            "negative": 숫자,
            "neutral": 숫자,
            "positiveKeywords": [{"keyword": "단어", "score": 숫자}, ...],
            "negativeKeywords": [{"keyword": "단어", "score": 숫자}, ...]
          }
          
          숫자만 제공하고 설명은 하지 마세요.`
        },
        {
          role: "user",
          content: allText
        }
      ],
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content || "{}";
    const sentimentData = JSON.parse(responseText);
    
    return {
      positive: sentimentData.positive || 0,
      negative: sentimentData.negative || 0,
      neutral: sentimentData.neutral || 0,
      positiveKeywords: sentimentData.positiveKeywords || [],
      negativeKeywords: sentimentData.negativeKeywords || []
    };
  } catch (error) {
    console.error('감정 분석 중 오류:', error);
    return {
      positive: 0,
      negative: 0,
      neutral: 100,
      positiveKeywords: [],
      negativeKeywords: []
    };
  }
}

// 광고 제안 생성 함수
async function generateAdSuggestions(
  keyword: string, 
  blogItems: any[], 
  keywords: Array<{keyword: string, frequency: number}>,
  sentiment?: KeywordAnalysisResult['sentiment']
): Promise<KeywordAnalysisResult['adSuggestions']> {
  // HTML 태그 제거 함수
  const removeHtmlTags = (text: string) => text.replace(/<[^>]*>/g, '');
  
  try {
    // 상위 5개 블로그 컨텐츠 추출
    const topBlogContent = blogItems.slice(0, 5).map(item => {
      const title = removeHtmlTags(item.title);
      const description = removeHtmlTags(item.description);
      return `제목: ${title}\n내용: ${description}`;
    }).join('\n\n');
    
    // 상위 키워드 추출
    const topKeywords = keywords.slice(0, 5).map(k => k.keyword).join(', ');
    
    // 감정 분석 정보 가공
    let sentimentInfo = '';
    if (sentiment) {
      const positiveKeywords = sentiment.positiveKeywords.map(k => k.keyword).join(', ');
      const negativeKeywords = sentiment.negativeKeywords.map(k => k.keyword).join(', ');
      sentimentInfo = `
긍정적 비율: ${sentiment.positive}%
부정적 비율: ${sentiment.negative}%
중립적 비율: ${sentiment.neutral}%
긍정적 키워드: ${positiveKeywords}
부정적 키워드: ${negativeKeywords}`;
    }

    // OpenAI를 사용한 광고 소재 생성
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `당신은 전문 광고 카피라이터입니다. 주어진 데이터를 분석하여 10개의 광고 소재를 생성해주세요.

응답은 반드시 다음과 같은 JSON 형식이어야 합니다:
{
  "ads": [
    {
      "headline": "광고 제목 (45자 이내)",
      "description": "광고 설명 (90자 이내)",
      "target": "타겟 고객층"
    }
  ]
}

광고 소재 생성 시 다음 사항을 고려하세요:
- 실제 데이터에서 추출한 인사이트를 활용
- 긍정적인 감정과 키워드를 강조
- 타겟 고객층을 구체적으로 정의
- 설득력 있는 문구 사용
- 실제 사용자 니즈 반영
- 트렌드와 시의성 반영`
        },
        {
          role: "user",
          content: `검색 키워드: ${keyword}

분석된 컨텐츠:
${topBlogContent}

주요 키워드: ${topKeywords}

감정 분석 결과:
${sentimentInfo}

위 정보를 바탕으로 10개의 광고 소재를 생성해주세요.`
        }
      ]
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      console.error('GPT 응답이 비어있습니다.');
      return generateDefaultAdSuggestions(keyword, keywords);
    }

    try {
      const suggestions = JSON.parse(responseText);
      if (Array.isArray(suggestions.ads) && suggestions.ads.length > 0) {
        return suggestions.ads.slice(0, 10);
      } else {
        console.error('GPT 응답이 올바른 형식이 아닙니다:', responseText);
        return generateDefaultAdSuggestions(keyword, keywords);
      }
    } catch (parseError) {
      console.error('GPT 응답 파싱 중 오류:', parseError, 'Response:', responseText);
      return generateDefaultAdSuggestions(keyword, keywords);
    }

  } catch (error) {
    console.error('광고 소재 생성 중 오류:', error);
    return generateDefaultAdSuggestions(keyword, keywords);
  }
}

// 기본 광고 소재 생성 함수
function generateDefaultAdSuggestions(
  keyword: string,
  keywords: Array<{keyword: string, frequency: number}>
): Array<{headline: string; description: string; target: string}> {
  const relatedKeywords = keywords.slice(0, 3).map(k => k.keyword);
  
  return [
    {
      headline: `${keyword}로 지금 바로 시작하세요`,
      description: `최고의 ${keyword} 솔루션으로 당신의 문제를 해결해 드립니다. 지금 확인해 보세요!`,
      target: '모든 사용자'
    },
    {
      headline: `전문가들이 추천하는 ${keyword}`,
      description: `${relatedKeywords[0] || '전문가'}의 추천으로 더 나은 결과를 경험하세요. 클릭 한 번으로 시작하세요.`,
      target: '품질을 중시하는 고객'
    },
    {
      headline: `${keyword}의 새로운 기준`,
      description: `최신 트렌드에 맞춘 ${keyword} 서비스로 차별화된 경험을 제공합니다.`,
      target: '트렌드에 민감한 사용자'
    },
    {
      headline: `${keyword} 고민, 이제 끝!`,
      description: `${relatedKeywords[1] || '고객'} 만족도 98%! 검증된 ${keyword} 서비스를 지금 확인하세요.`,
      target: '문제 해결이 필요한 고객'
    },
    {
      headline: `단 7일만에 ${keyword} 마스터`,
      description: `빠르고 쉽게 ${keyword}를 배우는 방법. 지금 가입하면 무료 체험 제공!`,
      target: '효율을 중시하는 고객'
    },
    {
      headline: `${keyword}의 숨겨진 비밀`,
      description: `많은 사람들이 모르는 ${keyword}의 효과적인 활용법을 알려드립니다.`,
      target: '깊은 정보를 원하는 고객'
    },
    {
      headline: `${keyword} 비용 50% 절감 방법`,
      description: `스마트한 선택으로 ${keyword} 비용을 절반으로 줄이세요. 지금 클릭!`,
      target: '비용 효율을 중시하는 고객'
    },
    {
      headline: `1위 ${keyword} 서비스`,
      description: `${relatedKeywords[2] || '사용자'} 평가 1위! 최고의 ${keyword} 솔루션을 지금 만나보세요.`,
      target: '신뢰성을 중시하는 고객'
    },
    {
      headline: `${keyword} 초보자 가이드`,
      description: `${keyword}를 처음 접하는 분들을 위한 친절한 가이드. 지금 무료로 시작하세요!`,
      target: '초보 사용자'
    },
    {
      headline: `${keyword} 전문가의 조언`,
      description: `10년 경력의 ${keyword} 전문가가 알려주는 핵심 팁과 노하우.`,
      target: '전문적인 정보를 찾는 고객'
    }
  ];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<KeywordAnalysisResult | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { keyword, contentType = 'blog' } = req.body;

  if (!keyword || typeof keyword !== 'string') {
    return res.status(400).json({ error: '유효한 검색어를 입력해주세요' });
  }

  // 네이버 API 키 확인
  if (!naverClientId || !naverClientSecret) {
    return res.status(500).json({ error: '네이버 API 키가 설정되지 않았습니다.' });
  }

  // 유튜브 API 키 확인 (유튜브 검색인 경우)
  if (contentType === 'youtube' && !youtubeApiKey) {
    return res.status(500).json({ error: 'YouTube API 키가 설정되지 않았습니다.' });
  }

  try {
    // 콘텐츠 유형에 따른 API 엔드포인트 선택
    let url = 'https://openapi.naver.com/v1/search/blog.json';
    if (contentType === 'cafe') {
      url = 'https://openapi.naver.com/v1/search/cafearticle.json';
    } else if (contentType === 'news') {
      url = 'https://openapi.naver.com/v1/search/news.json';
    }
    
    const params = {
      query: keyword,
      display: 30,
      start: 1,
      sort: 'sim'
    };
    
    let items = [];
    
    // 콘텐츠 유형에 따라 다른 API 호출
    if (contentType === 'youtube') {
      // YouTube Data API를 사용하여 검색
      const youtubeUrl = `https://www.googleapis.com/youtube/v3/search`;
      const youtubeParams = {
        part: 'snippet',
        q: keyword,
        maxResults: 30,
        type: 'video',
        key: youtubeApiKey
      };
      
      const youtubeResponse = await axios.get(youtubeUrl, { params: youtubeParams });
      
      // YouTube API 응답 형식을 우리 애플리케이션에 맞게 변환
      items = youtubeResponse.data.items.map(item => ({
        title: item.snippet.title,
        link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium.url,
        publishedAt: item.snippet.publishedAt,
        channelTitle: item.snippet.channelTitle
      }));
    } else {
      // 네이버 API 사용 (블로그, 카페, 뉴스)
      const response = await axios.get(url, {
        params,
        headers: {
          'X-Naver-Client-Id': naverClientId,
          'X-Naver-Client-Secret': naverClientSecret
        }
      });
      
      items = response.data.items || [];
    }
    
    // 사용할 항목 결정
    const contentItems = items;
    
    // 키워드 분석 수행
    const keywordResult = await analyzeKeywords(contentItems);
    
    // 감정 분석 수행
    const sentimentResult = await analyzeSentiment(contentItems);
    
    // 개별 컨텐츠 긍부정 평가 수행
    const contentSentiments = await analyzeContentSentiments(contentItems);
    
    // 결과 합치기
    const result: KeywordAnalysisResult = {
      ...keywordResult,
      sentiment: sentimentResult,
      contentType,
      contentItems: contentSentiments
    };
    
    // 응답 반환
    res.status(200).json(result);
  } catch (error) {
    console.error('키워드 분석 처리 중 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
}

// 개별 컨텐츠 항목 감정 분석 함수
async function analyzeContentSentiments(items: any[]): Promise<ContentItem[]> {
  if (!items || items.length === 0) {
    return [];
  }
  
  try {
    // 비용 효율성을 위해 최대 30개까지만 분석
    const itemsToAnalyze = items.slice(0, 30);
    
    // 각 아이템의 제목과 내용에서 HTML 태그 제거하고 감정 분석 준비
    const textsToAnalyze = itemsToAnalyze.map(item => {
      const title = item.title.replace(/<[^>]*>/g, '');
      const description = item.description.replace(/<[^>]*>/g, '');
      return `제목: ${title}\n내용: ${description}`;
    });
    
    // 한 번의 API 호출로 모든 아이템 분석 요청
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `당신은 텍스트의 감정을 분석하는 전문가입니다. 여러 텍스트를 분석하여 각각의 감정(긍정/부정/중립)과 그 강도를 평가해주세요.`
        },
        {
          role: "user",
          content: `다음은 ${itemsToAnalyze.length}개의 컨텐츠 항목입니다. 각 항목에 대해 감정 분석을 수행하고 JSON 배열 형식으로 결과를 반환해주세요.
각 항목은 "positive"(긍정), "negative"(부정), "neutral"(중립) 중 하나의 감정으로 분류하고, 0.0에서 1.0 사이의 점수로 그 강도를 표시해주세요.
점수가 높을수록 해당 감정이 강하게 표현된 것입니다.

반환 형식:
[
  {"index": 0, "sentiment": "positive", "score": 0.8},
  {"index": 1, "sentiment": "negative", "score": 0.7},
  {"index": 2, "sentiment": "neutral", "score": 0.5},
  ...
]

분석할 컨텐츠:
${textsToAnalyze.map((text, idx) => `[${idx}] ${text}`).join('\n\n')}`
        }
      ],
      temperature: 0.2,
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error('응답이 비어있습니다');
    }

    try {
      // JSON 형식 추출 및 파싱
      const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : '';
      const sentimentResults = JSON.parse(jsonStr);
      
      // 디버깅용 로그 추가
      console.log("분석할 컨텐츠 첫 번째 항목 샘플:", itemsToAnalyze[0]);
      
      // 원본 아이템에 감정 분석 결과 추가
      return itemsToAnalyze.map((item, index) => {
        const result = sentimentResults.find((r: any) => r.index === index);
        
        // 작성일 정보 처리
        let publishedAt = undefined;
        
        // 디버깅: 날짜 관련 필드 확인
        console.log(`아이템 ${index} 날짜 필드:`, {
          title: item.title.substring(0, 20) + '...',
          publishedAt: item.publishedAt,
          pubDate: item.pubDate,
          postdate: item.postdate
        });
        
        // 유튜브 결과는 publishedAt 필드가 있음
        if (item.publishedAt) {
          publishedAt = item.publishedAt;
        } 
        // 네이버 뉴스 결과는 pubDate 필드 확인
        else if (item.pubDate) {
          try {
            const date = new Date(item.pubDate);
            if (!isNaN(date.getTime())) {
              publishedAt = date.toISOString();
              console.log("뉴스 pubDate 변환 성공:", item.pubDate, "->", publishedAt);
            }
          } catch (e) {
            console.error("뉴스 pubDate 변환 실패:", e);
          }
        }
        // 네이버 API 결과에서는 postdate 필드 확인 (블로그, 카페)
        else if (item.postdate) {
          // postdate를 YYYY-MM-DD 형식으로 변환 (네이버 API는 YYYYMMDD 형식)
          const postdate = item.postdate;
          if (postdate && postdate.length === 8) {
            publishedAt = `${postdate.slice(0, 4)}-${postdate.slice(4, 6)}-${postdate.slice(6, 8)}`;
          }
        }
        
        return {
          title: item.title,
          link: item.link,
          description: item.description,
          sentiment: result ? result.sentiment : 'neutral',
          score: result ? result.score : 0.5,
          publishedAt: publishedAt
        };
      });
    } catch (error) {
      console.error('개별 컨텐츠 감정 분석 결과 파싱 오류:', error);
      // 오류 발생 시 기본값 반환
      return itemsToAnalyze.map(item => {
        // 작성일 정보 처리
        let publishedAt = undefined;
        
        // 유튜브 결과는 publishedAt 필드가 있음
        if (item.publishedAt) {
          publishedAt = item.publishedAt;
        } 
        // 네이버 뉴스 결과는 pubDate 필드 확인
        else if (item.pubDate) {
          try {
            const date = new Date(item.pubDate);
            if (!isNaN(date.getTime())) {
              publishedAt = date.toISOString();
            }
          } catch (e) {
            console.error("뉴스 pubDate 변환 실패:", e);
          }
        }
        // 네이버 API 결과에서는 postdate 필드 확인 (블로그, 카페)
        else if (item.postdate) {
          // postdate를 YYYY-MM-DD 형식으로 변환 (네이버 API는 YYYYMMDD 형식)
          const postdate = item.postdate;
          if (postdate && postdate.length === 8) {
            publishedAt = `${postdate.slice(0, 4)}-${postdate.slice(4, 6)}-${postdate.slice(6, 8)}`;
          }
        }
        
        return {
          title: item.title,
          link: item.link,
          description: item.description,
          sentiment: 'neutral',
          score: 0.5,
          publishedAt: publishedAt
        };
      });
    }
  } catch (error) {
    console.error('개별 컨텐츠 감정 분석 오류:', error);
    // 오류 발생 시 기본값 반환
    return items.slice(0, 30).map(item => {
      // 작성일 정보 처리
      let publishedAt = undefined;
      
      // 유튜브 결과는 publishedAt 필드가 있음
      if (item.publishedAt) {
        publishedAt = item.publishedAt;
      } 
      // 네이버 뉴스 결과는 pubDate 필드 확인
      else if (item.pubDate) {
        try {
          const date = new Date(item.pubDate);
          if (!isNaN(date.getTime())) {
            publishedAt = date.toISOString();
          }
        } catch (e) {
          console.error("뉴스 pubDate 변환 실패:", e);
        }
      }
      // 네이버 API 결과에서는 postdate 필드 확인 (블로그, 카페)
      else if (item.postdate) {
        // postdate를 YYYY-MM-DD 형식으로 변환 (네이버 API는 YYYYMMDD 형식)
        const postdate = item.postdate;
        if (postdate && postdate.length === 8) {
          publishedAt = `${postdate.slice(0, 4)}-${postdate.slice(4, 6)}-${postdate.slice(6, 8)}`;
        }
      }
      
      return {
        title: item.title,
        link: item.link,
        description: item.description,
        sentiment: 'neutral',
        score: 0.5,
        publishedAt: publishedAt
      };
    });
  }
} 