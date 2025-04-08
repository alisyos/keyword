import '../styles/globals.css';
import { AppProps } from 'next/app';
import Navbar from '../components/Navbar';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isKeywordAnalysisPage = router.pathname === '/keyword-analysis';

  return (
    <>
      {!isKeywordAnalysisPage && <Navbar />}
      <div className={!isKeywordAnalysisPage ? "pt-16" : ""}> {/* 네비게이션 바가 있을 때만 패딩 추가 */}
        <Component {...pageProps} />
      </div>
    </>
  );
}

export default MyApp; 