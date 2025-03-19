import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { OpenAI } from 'openai';

// OpenAI 인스턴스 생성
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 네이버 API 설정
const naverClientId = process.env.NAVER_CLIENT_ID;
const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

interface AdSuggestion {
  headline: string;
  description: string;
  target: string;
}

// 광고 제안 생성 함수
async function generateAdSuggestions(
  keyword: string,
  contentType: string
): Promise<AdSuggestion[]> {
  try {
    // 네이버 API로 컨텐츠 가져오기
    let url = 'https://openapi.naver.com/v1/search/blog.json';
    if (contentType === 'cafe') {
      url = 'https://openapi.naver.com/v1/search/cafearticle.json';
    }
    
    const params = {
      query: keyword,
      display: 5,
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
    
    // HTML 태그 제거 함수
    const removeHtmlTags = (text: string) => text.replace(/<[^>]*>/g, '');
    
    // 상위 5개 컨텐츠 추출
    const topContent = items.slice(0, 5).map(item => {
      const title = removeHtmlTags(item.title);
      const description = removeHtmlTags(item.description);
      return `제목: ${title}\n내용: ${description}`;
    }).join('\n\n');

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
${topContent}

위 정보를 바탕으로 10개의 광고 소재를 생성해주세요.`
        }
      ]
    });

    const responseText = completion.choices[0].message.content;
    console.log('OpenAI 응답:', responseText);
    
    if (!responseText) {
      console.error('GPT 응답이 비어있습니다.');
      throw new Error('GPT 응답이 비어있습니다.');
    }

    try {
      const suggestions = JSON.parse(responseText);
      if (Array.isArray(suggestions.ads) && suggestions.ads.length > 0) {
        return suggestions.ads.slice(0, 10);
      } else {
        console.error('GPT 응답 형식이 올바르지 않습니다:', suggestions);
        throw new Error('GPT 응답이 올바른 형식이 아닙니다.');
      }
    } catch (parseError) {
      console.error('GPT 응답 파싱 오류:', parseError, responseText);
      throw new Error('GPT 응답을 파싱할 수 없습니다.');
    }

  } catch (error) {
    console.error('광고 소재 생성 중 오류:', error);
    return generateDefaultAdSuggestions(keyword);
  }
}

// 기본 광고 소재 생성 함수
function generateDefaultAdSuggestions(keyword: string): AdSuggestion[] {
  return [
    {
      headline: `${keyword}로 지금 바로 시작하세요`,
      description: `최고의 ${keyword} 솔루션으로 당신의 문제를 해결해 드립니다. 지금 확인해 보세요!`,
      target: '모든 사용자'
    },
    {
      headline: `전문가들이 추천하는 ${keyword}`,
      description: `전문가의 추천으로 더 나은 결과를 경험하세요. 클릭 한 번으로 시작하세요.`,
      target: '품질을 중시하는 고객'
    },
    {
      headline: `${keyword}의 새로운 기준`,
      description: `최신 트렌드에 맞춘 ${keyword} 서비스로 차별화된 경험을 제공합니다.`,
      target: '트렌드에 민감한 사용자'
    }
  ];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ adSuggestions: AdSuggestion[] } | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { keyword, contentType = 'blog' } = req.body;

  if (!keyword || typeof keyword !== 'string') {
    return res.status(400).json({ error: '유효한 검색어를 입력해주세요' });
  }

  try {
    const adSuggestions = await generateAdSuggestions(keyword, contentType);
    res.status(200).json({ adSuggestions });
  } catch (error) {
    console.error('광고 제안 생성 중 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
} 