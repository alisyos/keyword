# 키워드 요약 검색 서비스

이 프로젝트는 사용자가 입력한 키워드에 대해 네이버 블로그, 네이버 카페, 유튜브 검색 결과를 크롤링하고 AI를 통해 요약하여 보여주는 웹 서비스입니다.

## 주요 기능

- 키워드 입력을 통한 통합 검색
- 네이버 블로그 검색 결과 요약 (네이버 검색 API 활용)
- 네이버 카페 검색 결과 요약 (네이버 검색 API 활용)
- 유튜브 검색 결과 요약
- OpenAI GPT를 활용한 검색 결과 요약 제공

## 기술 스택

- Next.js
- React
- TypeScript
- TailwindCSS
- OpenAI API
- 네이버 검색 API
- Cheerio (웹 스크래핑)
- Axios

## 시작하기

1. 저장소 클론
   ```
   git clone <repository-url>
   cd keyword-summarizer
   ```

2. 종속성 설치
   ```
   npm install
   ```

3. 환경 변수 설정
   `.env.local` 파일에서 API 키를 설정합니다.
   ```
   # OpenAI API 키
   OPENAI_API_KEY=your_openai_api_key_here
   
   # 네이버 API 키
   NAVER_CLIENT_ID=your_naver_client_id_here
   NAVER_CLIENT_SECRET=your_naver_client_secret_here
   ```

4. 네이버 개발자센터 설정
   - [네이버 개발자센터](https://developers.naver.com)에 회원가입 및 로그인합니다.
   - [Application 등록](https://developers.naver.com/apps/#/register) 페이지에서 애플리케이션을 등록합니다.
   - 애플리케이션 이름과 사용 API (검색)를 선택합니다.
   - 등록된 애플리케이션 정보에서 Client ID와 Client Secret을 확인하여 환경 변수에 입력합니다.

5. 개발 서버 실행
   ```
   npm run dev
   ```

6. 브라우저에서 http://localhost:3000 접속

## 사용 방법

1. 검색창에 원하는 키워드를 입력합니다.
2. 검색 버튼을 클릭하면 검색 결과가 요약되어 표시됩니다.
3. 네이버 블로그, 네이버 카페, 유튜브 섹션으로 나누어 결과를 확인할 수 있습니다.
4. 각 결과에는 관련 링크가 포함되어 있어 원본 콘텐츠로 이동할 수 있습니다.

## 제한사항

- 이 프로젝트는 학습 및 개인적인 사용 목적으로 만들어졌습니다.
- 네이버 검색 API는 하루 25,000건의 요청 제한이 있습니다.
- 상업적 용도로 사용 시 각 플랫폼의 이용약관을 확인해주세요.
- OpenAI API 사용에는 비용이 발생할 수 있습니다.
- 유튜브 검색 결과 크롤링은 YouTube API 정책에 따라 제한될 수 있습니다. 