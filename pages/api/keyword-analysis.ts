import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { OpenAI } from 'openai';

// 네이버 API 설정
const naverClientId = process.env.NAVER_CLIENT_ID;
const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

// OpenAI 인스턴스 생성
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface KeywordAnalysisResult {
  keywords: Array<{
    keyword: string;
    frequency: number;
  }>;
  sentiment?: {
    positive: number;
    negative: number;
    neutral: number;
    positiveKeywords: Array<{keyword: string, score: number}>;
    negativeKeywords: Array<{keyword: string, score: number}>;
  };
  adSuggestions?: Array<{
    headline: string;
    description: string;
    target: string;
  }>;
  contentType?: string;
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
부정적 키워드: ${negativeKeywords}
`;
  }
  
  try {
    // OpenAI를 사용한 광고 소재 생성
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `당신은 온라인 광고 전문가입니다. 주어진 키워드, 블로그 컨텐츠, 키워드 분석, 감정 분석 정보를 바탕으로 효과적인 광고 소재 10개를 제안해주세요.
          
각 광고 소재는 다음 요소를 포함해야 합니다:
1. 광고 제목(headline): 눈길을 끌고 클릭을 유도하는 짧은 제목 (최대 30자)
2. 광고 설명(description): 제품이나 서비스의 가치를 설명하는 내용 (최대 90자)
3. 타겟 고객(target): 이 광고가 가장 효과적일 것으로 예상되는 대상 고객층

응답은 다음 JSON 형식으로 제공해주세요:
[
  {
    "headline": "광고 제목",
    "description": "광고 설명",
    "target": "타겟 고객"
  },
  ...
]`
        },
        {
          role: "user",
          content: `키워드: ${keyword}

블로그 컨텐츠 샘플:
${topBlogContent}

관련 상위 키워드: ${topKeywords}

감정 분석 정보:
${sentimentInfo}

10개의 광고 소재 제안을 JSON 배열 형식으로 제공해주세요.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content || "[]";
    console.log('OpenAI 응답:', responseText); // 응답 로그 추가
    
    try {
      const parsedData = JSON.parse(responseText);
      // 응답이 배열인지 확인하고 처리
      if (Array.isArray(parsedData)) {
        return parsedData;
      } else if (parsedData && Array.isArray(parsedData.ads)) {
        // 일부 응답은 { ads: [...] } 형태로 올 수 있음
        return parsedData.ads;
      } else if (parsedData && typeof parsedData === 'object') {
        // JSON 객체 형태로 왔을 경우 기본 형식으로 변환
        const fallbackSuggestions = [];
        for (let i = 1; i <= 10; i++) {
          if (parsedData[`ad${i}`] || parsedData[i]) {
            const adData = parsedData[`ad${i}`] || parsedData[i];
            fallbackSuggestions.push({
              headline: adData.headline || adData.title || `광고 제목 ${i}`,
              description: adData.description || adData.content || `광고 설명 ${i}`,
              target: adData.target || adData.audience || '일반 사용자'
            });
          }
        }
        if (fallbackSuggestions.length > 0) {
          return fallbackSuggestions;
        }
      }
      
      // 위 모든 방법이 실패하면 하드코딩된 기본 광고 소재 제공
      return generateDefaultAdSuggestions(keyword, keywords);
    } catch (parseError) {
      console.error('응답 파싱 중 오류:', parseError);
      return generateDefaultAdSuggestions(keyword, keywords);
    }
  } catch (error) {
    console.error('광고 제안 생성 중 오류:', error);
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

  try {
    // 콘텐츠 유형에 따른 API 엔드포인트 선택
    let url = 'https://openapi.naver.com/v1/search/blog.json';
    if (contentType === 'cafe') {
      url = 'https://openapi.naver.com/v1/search/cafearticle.json';
    }
    
    const params = {
      query: keyword,
      display: 20, // 분석을 위해 더 많은 결과 가져오기
      start: 1,
      sort: 'sim'
    };
    
    const response = await axios.get(url, {
      params,
      headers: {
        'X-Naver-Client-Id': naverClientId,
        'X-Naver-Client-Secret': naverClientSecret
      }
    });
    
    const items = response.data.items || [];
    
    // 유튜브인 경우는 직접 크롤링 결과를 사용
    let youtubeItems = items;
    if (contentType === 'youtube') {
      try {
        const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}`;
        const youtubeResponse = await axios.get(youtubeUrl);
        const html = youtubeResponse.data;
        
        const videoPattern = /"videoRenderer":{"videoId":"([^"]+)","thumbnail.+?"title":{"runs":\[{"text":"([^"]+)"\}\]/g;
        const descriptionPattern = /"descriptionSnippet":{"runs":\[{"text":"([^"]+)"/g;
        
        youtubeItems = [];
        let match;
        let descMatches = [];
        
        // 설명 추출
        while ((match = descriptionPattern.exec(html)) !== null) {
          descMatches.push(match[1]);
        }
        
        // 비디오 정보 추출
        let index = 0;
        while ((match = videoPattern.exec(html)) !== null) {
          const videoId = match[1];
          const title = match[2];
          const description = descMatches[index] || '';
          const url = `https://www.youtube.com/watch?v=${videoId}`;
          
          youtubeItems.push({
            title,
            link: url,
            description
          });
          
          index++;
          if (youtubeItems.length >= 20) break;
        }
      } catch (error) {
        console.error('유튜브 데이터 가져오기 오류:', error);
        // 유튜브 데이터 가져오기 실패 시 빈 배열 사용
        youtubeItems = [];
      }
    }
    
    // 키워드 분석 수행
    const keywordResult = await analyzeKeywords(contentType === 'youtube' ? youtubeItems : items);
    
    // 감정 분석 수행
    const sentimentResult = await analyzeSentiment(contentType === 'youtube' ? youtubeItems : items);
    
    // 광고 제안 생성
    const adSuggestions = await generateAdSuggestions(
      keyword,
      contentType === 'youtube' ? youtubeItems : items,
      keywordResult.keywords,
      sentimentResult
    );
    
    // 결과 합치기
    const result: KeywordAnalysisResult = {
      ...keywordResult,
      sentiment: sentimentResult,
      adSuggestions,
      contentType
    };
    
    // 응답 반환
    res.status(200).json(result);
  } catch (error) {
    console.error('키워드 분석 처리 중 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
} 