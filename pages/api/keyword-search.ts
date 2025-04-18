import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

type SearchResult = {
  summary: string;
  links: Array<{
    title: string;
    url: string;
    description?: string;
    publishedAt?: string;
    pubDate?: string;
  }>;
};

type SearchResponse = {
  naverBlog: SearchResult | null;
  naverCafe: SearchResult | null;
  youtube: SearchResult | null;
  naverNews: SearchResult | null;
};

// 네이버 블로그 데이터 가져오기 (Mock)
async function fetchNaverBlogData(keyword: string): Promise<SearchResult> {
  try {
    return {
      summary: `"${keyword}"에 관한 네이버 블로그 검색 결과입니다. 최근 블로그에서는 이 키워드에 대해 다양한 정보와 경험을 공유하고 있습니다. 주로 사용자 경험, 제품 리뷰, 그리고 관련 팁에 대한 내용이 많이 언급되고 있습니다.`,
      links: [
        {
          title: `${keyword} 완벽 가이드: 초보자도 쉽게 따라할 수 있는 방법`,
          url: 'https://blog.naver.com/example1',
          description: '누구나 쉽게 따라할 수 있는 단계별 가이드와 팁을 정리했습니다.',
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          title: `${keyword}에 대한 5가지 오해와 진실`,
          url: 'https://blog.naver.com/example2',
          description: '많은 사람들이 잘못 알고 있는 정보를 바로잡고 정확한 정보를 제공합니다.',
          publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          title: `내가 경험한 ${keyword} 리얼 후기`,
          url: 'https://blog.naver.com/example3',
          description: '실제 사용해본 경험과 솔직한 의견을 공유합니다.',
          publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
      ],
    };
  } catch (error) {
    console.error('네이버 블로그 데이터 요청 중 오류:', error);
    throw error;
  }
}

// 네이버 카페 데이터 가져오기 (Mock)
async function fetchNaverCafeData(keyword: string): Promise<SearchResult> {
  try {
    // 현재 날짜를 사용하여 mock 데이터 생성
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(today.getDate() - 14);
    
    // 다양한 형식으로 날짜 출력 (RFC 2822 형식 포함)
    const yesterdayRFC = yesterday.toUTCString();
    
    return {
      summary: `네이버 카페에서 "${keyword}"에 관한 토론과 정보 공유가 활발히 이루어지고 있습니다. 다양한 커뮤니티에서 이용자들은 경험, 질문, 그리고 조언을 교환하고 있으며, 특히 전문 카페에서는 심층적인 정보를 찾아볼 수 있습니다.`,
      links: [
        {
          title: `[정보공유] ${keyword}에 관한 최신 정보 모음`,
          url: 'https://cafe.naver.com/example1',
          description: '커뮤니티에서 공유된 최신 정보와 유용한 팁을 한 곳에 모았습니다.',
          publishedAt: yesterday.toISOString(),
          // 추가 날짜 형식
          pubDate: yesterdayRFC
        },
        {
          title: `${keyword} 관련 질문 모음 (FAQ)`,
          url: 'https://cafe.naver.com/example2',
          description: '자주 묻는 질문과 답변을 정리했습니다. 초보자들에게 유용한 정보가 많습니다.',
          publishedAt: lastWeek.toISOString(),
          // 추가 날짜 형식
          pubDate: lastWeek.toUTCString()
        },
        {
          title: `${keyword} 전문가 추천 리스트`,
          url: 'https://cafe.naver.com/example3',
          description: '해당 분야 전문가들이 추천하는 제품과 방법에 대한 정보입니다.',
          publishedAt: twoWeeksAgo.toISOString(),
          // 추가 날짜 형식
          pubDate: twoWeeksAgo.toUTCString()
        },
      ],
    };
  } catch (error) {
    console.error('네이버 카페 데이터 요청 중 오류:', error);
    throw error;
  }
}

// 유튜브 데이터 가져오기 (Mock)
async function fetchYoutubeData(keyword: string): Promise<SearchResult> {
  try {
    return {
      summary: `유튜브에서 "${keyword}"를 검색한 결과, 다양한 컨텐츠 크리에이터들이 이 주제에 대한 영상을 제작하고 있습니다. 튜토리얼, 리뷰, 경험 공유 등 다양한 형태의 컨텐츠가 있으며, 최근에는 심층적인 분석 영상도 인기를 얻고 있습니다.`,
      links: [
        {
          title: `${keyword} 완벽 가이드 | 2023년 최신 정보`,
          url: 'https://youtube.com/watch?v=example1',
          description: '이 영상에서는 2023년 최신 정보와 변경사항을 상세히 다루고 있습니다.',
          publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          title: `초보자를 위한 ${keyword} 기초부터 고급까지`,
          url: 'https://youtube.com/watch?v=example2',
          description: '처음 접하는 사람도 이해하기 쉽게 기초부터 차근차근 설명합니다.',
          publishedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          title: `${keyword}에 대한 솔직한 리뷰와 팁`,
          url: 'https://youtube.com/watch?v=example3',
          description: '10년 경력의 전문가가 알려주는 진짜 유용한 팁과 솔직한 의견입니다.',
          publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
      ],
    };
  } catch (error) {
    console.error('유튜브 데이터 요청 중 오류:', error);
    throw error;
  }
}

// 네이버 뉴스 데이터 가져오기 (Mock)
async function fetchNaverNewsData(keyword: string): Promise<SearchResult> {
  try {
    // 현재 날짜를 사용하여 mock 데이터 생성
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(today.getDate() - 5);
    
    // 네이버 뉴스 API가 사용하는 RFC 2822 형식의 날짜 문자열로 변환
    const getFormattedDate = (date: Date) => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')} +0900`;
    };
    
    return {
      summary: `네이버 뉴스에서 "${keyword}"에 관한 최신 보도와 기사를 확인할 수 있습니다. 다양한 언론사들이 이 주제에 대한 소식, 분석, 그리고 전문가 인터뷰를 제공하고 있습니다. 최근 트렌드와 관련된 다양한 관점을 확인할 수 있습니다.`,
      links: [
        {
          title: `[속보] ${keyword} 관련 최신 개발 동향`,
          url: 'https://news.naver.com/example1',
          description: '최근 발표된 중요한 정보와 업계 전문가들의 분석을 담고 있습니다.',
          publishedAt: yesterday.toISOString(),
          // RFC 2822 형식의 pubDate 추가
          pubDate: getFormattedDate(yesterday)
        },
        {
          title: `${keyword}가 미치는 영향 심층 분석`,
          url: 'https://news.naver.com/example2',
          description: '다양한 측면에서 미치는 영향을 데이터를 기반으로 분석한 기사입니다.',
          publishedAt: threeDaysAgo.toISOString(),
          // RFC 2822 형식의 pubDate 추가
          pubDate: getFormattedDate(threeDaysAgo)
        },
        {
          title: `전문가 인터뷰: ${keyword}의 미래 전망`,
          url: 'https://news.naver.com/example3',
          description: '해당 분야 최고 전문가들이 전망하는 향후 발전 방향과 주요 변화에 대한 인사이트입니다.',
          publishedAt: fiveDaysAgo.toISOString(),
          // RFC 2822 형식의 pubDate 추가
          pubDate: getFormattedDate(fiveDaysAgo)
        },
      ],
    };
  } catch (error) {
    console.error('네이버 뉴스 데이터 요청 중 오류:', error);
    throw error;
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

    try {
      // 모든 검색 작업 병렬 실행
      const [naverBlogResults, naverCafeResults, youtubeResults, naverNewsResults] = await Promise.all([
        fetchNaverBlogData(keyword).catch(error => {
          console.error('네이버 블로그 검색 중 오류:', error);
          return null;
        }),
        fetchNaverCafeData(keyword).catch(error => {
          console.error('네이버 카페 검색 중 오류:', error);
          return null;
        }),
        fetchYoutubeData(keyword).catch(error => {
          console.error('유튜브 검색 중 오류:', error);
          return null;
        }),
        fetchNaverNewsData(keyword).catch(error => {
          console.error('네이버 뉴스 검색 중 오류:', error);
          return null;
        })
      ]);

      // 응답 반환
      return res.status(200).json({
        naverBlog: naverBlogResults,
        naverCafe: naverCafeResults,
        youtube: youtubeResults,
        naverNews: naverNewsResults
      });
    } catch (error) {
      console.error('검색 처리 중 오류:', error);
      return res.status(500).json({ error: '서버 오류가 발생했습니다' });
    }
  }
  
  // GET 요청이면 간단한 응답 반환
  else if (req.method === 'GET') {
    return res.status(200).json({ 
      message: '이 API는 POST 요청을 통해 키워드 검색 결과를 제공합니다.' 
    });
  }
  
  // 다른 HTTP 메소드는 허용하지 않음
  else {
    return res.status(405).json({ error: '허용되지 않는 메소드입니다' });
  }
} 