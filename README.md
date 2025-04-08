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
   OPENAI_API_KEY=your_openai_api_key
   
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

# 키워드 확장 도구

네이버 검색광고 API를 활용한 키워드 확장 도구입니다. 입력한 키워드를 기반으로 연관 키워드를 찾고, AI를 통해 키워드 분석을 제공합니다.

## 기능

- 키워드 확장: 입력한 키워드를 기반으로 연관 키워드 찾기
- AI 분석: 키워드 데이터를 기반으로 전문적인 분석 제공
- 데이터 시각화: 검색량, 클릭수, 클릭율, 경쟁정도 등 시각화

## 환경 설정

1. 다음의 환경 변수를 `.env.local` 파일에 설정합니다:

```
NAVER_API_KEY=your_naver_api_key
NAVER_API_SECRET=your_naver_api_secret
NAVER_CUSTOMER_ID=your_naver_customer_id
OPENAI_API_KEY=your_openai_api_key
```

2. 패키지 설치:

```bash
npm install
```

3. 개발 서버 실행:

```bash
npm run dev
```

## Render 배포 방법

이 프로젝트는 [Render](https://render.com)에 쉽게 배포할 수 있습니다.

1. [Render](https://render.com)에 계정 생성 및 로그인

2. 새 웹 서비스 생성
   - "New" 버튼 클릭 > "Web Service" 선택
   - GitHub 저장소 연결
   - 프로젝트 선택

3. 다음 설정으로 서비스 구성:
   - **Name**: `keyword-expansion` (또는 원하는 이름)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

4. 환경 변수 추가:
   - "Environment" 섹션에서 다음 환경 변수 추가:
     - `NODE_ENV`: `production`
     - `OPENAI_API_KEY`: OpenAI API 키
     - `NAVER_API_KEY`: 네이버 API 키
     - `NAVER_API_SECRET`: 네이버 API 시크릿
     - `NAVER_CUSTOMER_ID`: 네이버 고객 ID

5. "Create Web Service" 버튼 클릭

6. 배포 완료 후 제공된 URL로 접속하여 서비스 이용

## Blueprint 배포 (자동화)

`render.yaml` 파일을 사용하여 원클릭 배포를 설정할 수 있습니다:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy) 