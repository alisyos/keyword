import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import crypto from 'crypto';

interface ResponseData {
  message: string;
  data?: any;
  error?: string;
}

interface NaverKeywordData {
  relKeyword: string;
  monthlyPcQcCnt: string;
  monthlyMobileQcCnt: string;
  monthlyAvePcClkCnt: string;
  monthlyAveMobileClkCnt: string;
  monthlyAvePcCtr: string;
  monthlyAveMobileCtr: string;
  plAvgDepth: string;
  compIdx: string;
}

const generateSignature = (secretKey: string, timestamp: string, method: string, uri: string) => {
  const message = `${timestamp}.${method}.${uri}`;
  return crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('base64');
};

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed', error: 'POST 메소드만 지원됩니다.' });
  }

  const { keyword } = req.body;

  if (!keyword) {
    return res.status(400).json({ message: 'Bad request', error: '키워드가 필요합니다.' });
  }

  try {
    const apiKey = process.env.NAVER_API_KEY;
    const secretKey = process.env.NAVER_SECRET_KEY;
    const customerId = process.env.NAVER_CUSTOMER_ID;

    if (!apiKey || !secretKey || !customerId) {
      throw new Error('네이버 API 인증 정보가 설정되지 않았습니다.');
    }

    const timestamp = Date.now().toString();
    const method = 'GET';
    const uri = '/keywordstool';
    const signature = generateSignature(secretKey, timestamp, method, uri);

    const requestParams = {
      hintKeywords: keyword,
      showDetail: 1,
      customerId: customerId,
      biztpId: 1,
      event: 1,
      month: new Date().getMonth() + 1
    };

    console.log('API Request:', {
      url: `https://api.searchad.naver.com${uri}`,
      params: requestParams,
      headers: {
        'X-Timestamp': timestamp,
        'X-API-KEY': apiKey,
        'X-Customer': customerId,
        'X-Signature': signature,
        'Content-Type': 'application/json'
      }
    });

    const response = await axios.get(
      `https://api.searchad.naver.com${uri}`,
      {
        params: requestParams,
        headers: {
          'X-Timestamp': timestamp,
          'X-API-KEY': apiKey,
          'X-Customer': customerId,
          'X-Signature': signature,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('API Response:', response.data);

    if (!response.data || !response.data.keywordList) {
      throw new Error('API 응답 데이터가 올바르지 않습니다.');
    }

    const keywordData: NaverKeywordData[] = response.data.keywordList.map((item: any) => ({
      relKeyword: item.relKeyword,
      monthlyPcQcCnt: item.monthlyPcQcCnt,
      monthlyMobileQcCnt: item.monthlyMobileQcCnt,
      monthlyAvePcClkCnt: item.monthlyAvePcClkCnt,
      monthlyAveMobileClkCnt: item.monthlyAveMobileClkCnt,
      monthlyAvePcCtr: item.monthlyAvePcCtr,
      monthlyAveMobileCtr: item.monthlyAveMobileCtr,
      plAvgDepth: item.plAvgDepth,
      compIdx: item.compIdx
    }));

    return res.status(200).json({ 
      message: '성공',
      data: {
        keyword,
        timestamp: new Date().toISOString(),
        status: 'success',
        keywordList: keywordData
      }
    });
  } catch (error: any) {
    console.error('Error in keyword expansion:', error.response?.data || error.message);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.response?.data?.message || error.message || '서버 오류가 발생했습니다.'
    });
  }
};

export default handler; 