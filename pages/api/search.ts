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

// YouTube API 키 설정
const youtubeApiKey = process.env.YOUTUBE_API_KEY;

type SearchResult = {
  summary: string;
  links: Array<{
    title: string;
    url: string;
    description?: string;
  }>;
};

type SearchResponse = {
  naverBlog: SearchResult | null;
  naverCafe: SearchResult | null;
  youtube: SearchResult | null;
};

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
    display: 30,
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
    display: 30,
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

// 유튜브 검색 함수 (YouTube Data API 사용)
async function searchYoutube(keyword: string): Promise<SearchResult> {
  try {
    // YouTube Data API를 사용하여 검색
    const youtubeUrl = 'https://www.googleapis.com/youtube/v3/search';
    const youtubeParams = {
      part: 'snippet',
      q: keyword,
      maxResults: 30,
      type: 'video',
      key: youtubeApiKey
    };
    
    const response = await axios.get(youtubeUrl, { params: youtubeParams });
    
    // YouTube API 응답 형식을 우리 애플리케이션에 맞게 변환
    const videos = response.data.items.map(item => ({
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt
    }));
    
    // 요약을 위한 텍스트 생성
    let contentToSummarize = `다음은 유튜브에서 "${keyword}"에 관한 검색 결과입니다:\n\n`;
    videos.forEach((video, index) => {
      contentToSummarize += `${index + 1}. 제목: ${video.title}\n`;
      if (video.description) {
        contentToSummarize += `설명: ${video.description}\n`;
      }
      contentToSummarize += `채널: ${video.channelTitle}\n\n`;
    });
    
    // OpenAI를 사용한 요약
    const summary = await summarizeWithAI(contentToSummarize, keyword);
    
    // 결과 반환
    return {
      summary,
      links: videos
    };
  } catch (error) {
    console.error('유튜브 API 오류:', error);
    throw error;
  }
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
  res: NextApiResponse<SearchResponse | { error: string } | { message: string }>
) {
  // POST 요청 처리
  if (req.method === 'POST') {
    const { keyword } = req.body;

    if (!keyword || typeof keyword !== 'string') {
      return res.status(400).json({ error: '유효한 검색어를 입력해주세요' });
    }

    // 네이버 API 키 확인
    if (!naverClientId || !naverClientSecret) {
      return res.status(500).json({ error: '네이버 API 키가 설정되지 않았습니다.' });
    }

    // 유튜브 API 키 확인
    if (!youtubeApiKey) {
      return res.status(500).json({ error: 'YouTube API 키가 설정되지 않았습니다.' });
    }

    try {
      // 비동기 함수 병렬 실행
      const [naverBlogResult, naverCafeResult, youtubeResult] = await Promise.all([
        searchNaverBlog(keyword),
        searchNaverCafe(keyword),
        searchYoutube(keyword)
      ]);

      const searchResult: SearchResponse = {
        naverBlog: naverBlogResult,
        naverCafe: naverCafeResult,
        youtube: youtubeResult
      };

      res.status(200).json(searchResult);
    } catch (error) {
      console.error('검색 요청 처리 중 오류:', error);
      res.status(500).json({ error: '서버 오류가 발생했습니다' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
} 