import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

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
        },
        {
          title: `${keyword}에 대한 5가지 오해와 진실`,
          url: 'https://blog.naver.com/example2',
          description: '많은 사람들이 잘못 알고 있는 정보를 바로잡고 정확한 정보를 제공합니다.',
        },
        {
          title: `내가 경험한 ${keyword} 리얼 후기`,
          url: 'https://blog.naver.com/example3',
          description: '실제 사용해본 경험과 솔직한 의견을 공유합니다.',
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
    return {
      summary: `네이버 카페에서 "${keyword}"에 관한 토론과 정보 공유가 활발히 이루어지고 있습니다. 다양한 커뮤니티에서 이용자들은 경험, 질문, 그리고 조언을 교환하고 있으며, 특히 전문 카페에서는 심층적인 정보를 찾아볼 수 있습니다.`,
      links: [
        {
          title: `[정보공유] ${keyword}에 관한 최신 정보 모음`,
          url: 'https://cafe.naver.com/example1',
          description: '커뮤니티에서 공유된 최신 정보와 유용한 팁을 한 곳에 모았습니다.',
        },
        {
          title: `${keyword} 관련 질문 모음 (FAQ)`,
          url: 'https://cafe.naver.com/example2',
          description: '자주 묻는 질문과 답변을 정리했습니다. 초보자들에게 유용한 정보가 많습니다.',
        },
        {
          title: `${keyword} 전문가 추천 리스트`,
          url: 'https://cafe.naver.com/example3',
          description: '해당 분야 전문가들이 추천하는 제품과 방법에 대한 정보입니다.',
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
        },
        {
          title: `초보자를 위한 ${keyword} 기초부터 고급까지`,
          url: 'https://youtube.com/watch?v=example2',
          description: '처음 접하는 사람도 이해하기 쉽게 기초부터 차근차근 설명합니다.',
        },
        {
          title: `${keyword}에 대한 솔직한 리뷰와 팁`,
          url: 'https://youtube.com/watch?v=example3',
          description: '10년 경력의 전문가가 알려주는 진짜 유용한 팁과 솔직한 의견입니다.',
        },
      ],
    };
  } catch (error) {
    console.error('유튜브 데이터 요청 중 오류:', error);
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchResponse | { error: string }>
) {
  // POST 요청 처리
  if (req.method === 'POST') {
    const { keyword } = req.body;

    if (!keyword || typeof keyword !== 'string') {
      return res.status(400).json({ error: '유효한 검색어를 입력해주세요' });
    }

    try {
      // 모든 검색 작업 병렬 실행
      const [naverBlogResults, naverCafeResults, youtubeResults] = await Promise.all([
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
        })
      ]);

      // 응답 반환
      return res.status(200).json({
        naverBlog: naverBlogResults,
        naverCafe: naverCafeResults,
        youtube: youtubeResults
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