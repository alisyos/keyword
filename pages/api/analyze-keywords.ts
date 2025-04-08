import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { keywordData, userQuery } = req.body;

    const prompt = `다음은 키워드 검색 데이터입니다:
${JSON.stringify(keywordData, null, 2)}

사용자 질문: ${userQuery}

위 데이터를 기반으로 사용자의 질문에 전문가적인 관점에서 답변해주세요. 
데이터에 포함된 검색량, 클릭수, 클릭율, 경쟁정도 등을 종합적으로 고려하여 분석해주세요.
답변은 마크다운 형식으로 작성해주세요.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "당신은 디지털 마케팅과 키워드 분석 전문가입니다. 데이터를 기반으로 통찰력 있는 분석을 제공합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    const analysis = completion.choices[0].message.content;
    res.status(200).json({ analysis });
  } catch (error) {
    console.error('Error analyzing keywords:', error);
    res.status(500).json({ message: 'Error analyzing keywords' });
  }
} 