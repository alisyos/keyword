import '../styles/globals.css';
import { AppProps } from 'next/app';
import Navbar from '../components/Navbar';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Navbar />
      <div className="pt-16"> {/* 네비게이션 바 높이만큼 패딩 추가 */}
        <Component {...pageProps} />
      </div>
    </>
  );
}

export default MyApp; 