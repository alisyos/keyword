import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { OpenAI } from 'openai';

// OpenAI 인스턴스 생성
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 네이버 API 설정
const naverClientId = process.env.NAVER_CLIENT_ID;
const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

interface SearchResult {
  summary: string;
  links: Array<{
    title: string;
    url: string;
    description?: string;
  }>;
}

interface SearchResponse {
  naverBlog: SearchResult | null;
  naverCafe: SearchResult | null;
  youtube: SearchResult | null;
}

interface NaverSearchItem {
  title: string;
  link: string;
  description: string;
  bloggername?: string;
  bloggerlink?: string;
  postdate?: string;
  cafename?: string;
}

// 네이버 블로그 검색 API 사용
async function searchNaverBlog(keyword: string): Promise<SearchResult> {
  const url = 'https://openapi.naver.com/v1/search/blog.json';
  const params = {
    query: keyword,
    display: 10,
    start: 1,
    sort: 'sim' // 정확도순 정렬
  };
  
  try {
    const response = await axios.get(url, {
      params,
      headers: {
        'X-Naver-Client-Id': naverClientId,
        'X-Naver-Client-Secret': naverClientSecret
      }
    });
    
    const items: NaverSearchItem[] = response.data.items || [];
    
    // HTML 태그 제거 함수
    const removeHtmlTags = (text: string) => text.replace(/<[^>]*>/g, '');
    
    // 요약을 위한 텍스트 생성
    let contentToSummarize = `다음은 네이버 블로그에서 "${keyword}"에 관한 검색 결과입니다:\n\n`;
    
    items.forEach((item, index) => {
      const title = removeHtmlTags(item.title);
      const description = removeHtmlTags(item.description);
      contentToSummarize += `${index + 1}. 제목: ${title}\n내용: ${description}\n작성자: ${item.bloggername}\n\n`;
    });
    
    // OpenAI를 사용한 요약
    const summary = await summarizeWithAI(contentToSummarize, keyword);
    
    // 결과 반환
    return {
      summary,
      links: items.map(item => ({
        title: removeHtmlTags(item.title),
        url: item.link,
        description: removeHtmlTags(item.description)
      }))
    };
  } catch (error) {
    console.error('네이버 블로그 API 오류:', error);
    throw error;
  }
}

// 네이버 카페 검색 API 사용
async function searchNaverCafe(keyword: string): Promise<SearchResult> {
  const url = 'https://openapi.naver.com/v1/search/cafearticle.json';
  const params = {
    query: keyword,
    display: 10,
    start: 1,
    sort: 'sim' // 정확도순 정렬
  };
  
  try {
    const response = await axios.get(url, {
      params,
      headers: {
        'X-Naver-Client-Id': naverClientId,
        'X-Naver-Client-Secret': naverClientSecret
      }
    });
    
    const items: NaverSearchItem[] = response.data.items || [];
    
    // HTML 태그 제거 함수
    const removeHtmlTags = (text: string) => text.replace(/<[^>]*>/g, '');
    
    // 요약을 위한 텍스트 생성
    let contentToSummarize = `다음은 네이버 카페에서 "${keyword}"에 관한 검색 결과입니다:\n\n`;
    
    items.forEach((item, index) => {
      const title = removeHtmlTags(item.title);
      const description = removeHtmlTags(item.description);
      contentToSummarize += `${index + 1}. 제목: ${title}\n내용: ${description}\n카페: ${item.cafename}\n\n`;
    });
    
    // OpenAI를 사용한 요약
    const summary = await summarizeWithAI(contentToSummarize, keyword);
    
    // 결과 반환
    return {
      summary,
      links: items.map(item => ({
        title: removeHtmlTags(item.title),
        url: item.link,
        description: removeHtmlTags(item.description)
      }))
    };
  } catch (error) {
    console.error('네이버 카페 API 오류:', error);
    throw error;
  }
}

// 유튜브 검색 및 스크래핑
async function searchYoutube(keyword: string): Promise<SearchResult> {
  const encodedKeyword = encodeURIComponent(keyword);
  const url = `https://www.youtube.com/results?search_query=${encodedKeyword}`;
  
  const response = await axios.get(url);
  const html = response.data;
  
  // 비디오 정보 및 설명 추출을 위한 패턴
  const videoInfoPattern = /"videoRenderer":{"videoId":"([^"]+)","thumbnail.+?"title":{"runs":\[{"text":"([^"]+)"\}\].+?"descriptionSnippet":{"runs":\[{"text":"([^"]+)"/g;
  const simpleVideoPattern = /"videoRenderer":{"videoId":"([^"]+)","thumbnail.+?"title":{"runs":\[{"text":"([^"]+)"\}\]/g;
  
  const videos: { title: string; url: string; description?: string }[] = [];
  let match;
  
  // 설명이 있는 비디오 먼저 추출
  while ((match = videoInfoPattern.exec(html)) !== null) {
    const videoId = match[1];
    const title = match[2];
    const description = match[3];
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    
    videos.push({ title, url, description });
    
    if (videos.length >= 10) break;
  }
  
  // 설명이 없는 비디오도 추출 (10개까지 채우기 위해)
  if (videos.length < 10) {
    while ((match = simpleVideoPattern.exec(html)) !== null) {
      const videoId = match[1];
      const title = match[2];
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      
      // 이미 추가된 비디오는 건너뛰기
      if (!videos.some(v => v.url === url)) {
        videos.push({ title, url });
      }
      
      if (videos.length >= 10) break;
    }
  }
  
  // 요약을 위한 텍스트 생성
  let contentToSummarize = '다음은 유튜브에서 "' + keyword + '"에 관한 검색 결과입니다:\n\n';
  videos.forEach((video, index) => {
    contentToSummarize += `${index + 1}. 제목: ${video.title}\n`;
    if (video.description) {
      contentToSummarize += `설명: ${video.description}\n`;
    }
    contentToSummarize += '\n';
  });
  
  // OpenAI를 사용한 요약
  const summary = await summarizeWithAI(contentToSummarize, keyword);
  
  // 결과 반환
  return {
    summary,
    links: videos
  };
}

// OpenAI API를 사용한 텍스트 요약
async function summarizeWithAI(content: string, keyword: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `당신은 검색 결과를 요약하는 전문가입니다. 다음 검색 결과에서 "${keyword}"와 관련된 중요한 정보를 추출하여 500자 내외로 요약해주세요. 요약은 한국어로 작성해야 합니다.`
        },
        {
          role: "user",
          content
        }
      ],
      max_tokens: 500
    });

    return completion.choices[0].message.content || "요약을 생성할 수 없습니다.";
  } catch (error) {
    console.error('OpenAI API 요약 중 오류:', error);
    return "요약 서비스에 일시적인 오류가 발생했습니다.";
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { keyword } = req.body;

  if (!keyword || typeof keyword !== 'string') {
    return res.status(400).json({ error: '유효한 검색어를 입력해주세요' });
  }

  // 네이버 API 키 확인
  if (!naverClientId || !naverClientSecret) {
    return res.status(500).json({ error: '네이버 API 키가 설정되지 않았습니다.' });
  }

  try {
    // 모든 검색 작업 병렬 실행
    const [naverBlogResults, naverCafeResults, youtubeResults] = await Promise.all([
      searchNaverBlog(keyword).catch(error => {
        console.error('네이버 블로그 검색 중 오류:', error);
        return null;
      }),
      searchNaverCafe(keyword).catch(error => {
        console.error('네이버 카페 검색 중 오류:', error);
        return null;
      }),
      searchYoutube(keyword).catch(error => {
        console.error('유튜브 검색 중 오류:', error);
        return null;
      })
    ]);

    // 응답 반환
    res.status(200).json({
      naverBlog: naverBlogResults,
      naverCafe: naverCafeResults,
      youtube: youtubeResults
    });
  } catch (error) {
    console.error('검색 처리 중 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
} 