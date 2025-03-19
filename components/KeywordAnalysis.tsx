import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Tabs, Tab, Box, CircularProgress, Typography } from '@mui/material';
import KeywordFrequencyChart from './KeywordFrequencyChart';
import SentimentAnalysis from './SentimentAnalysis';
import AdSuggestions from './AdSuggestions';

interface KeywordAnalysisProps {
  keyword: string;
  contentType: string;
}

interface KeywordData {
  keyword: string;
  frequency: number;
}

interface SentimentData {
  positive: number;
  negative: number;
  neutral: number;
  positiveKeywords: Array<{keyword: string; score: number}>;
  negativeKeywords: Array<{keyword: string; score: number}>;
}

interface AdSuggestion {
  headline: string;
  description: string;
  target: string;
}

interface AnalysisData {
  keywords: KeywordData[];
  sentiment?: SentimentData;
  contentType?: string;
}

const KeywordAnalysis: React.FC<KeywordAnalysisProps> = ({ keyword, contentType }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingAds, setLoadingAds] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [adSuggestions, setAdSuggestions] = useState<AdSuggestion[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.post('/api/keyword-analysis', { keyword, contentType });
        setData(response.data);
      } catch (err) {
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
        console.error('Error fetching data:', err);
      }
      setLoading(false);
    };

    fetchData();
  }, [keyword, contentType]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleGenerateAds = async () => {
    setLoadingAds(true);
    try {
      const response = await axios.post('/api/generate-ad-suggestions', { keyword, contentType });
      setAdSuggestions(response.data.adSuggestions);
    } catch (err) {
      console.error('Error fetching ad suggestions:', err);
    } finally {
      setLoadingAds(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs value={activeTab} onChange={handleTabChange} aria-label="analysis tabs">
        <Tab label="키워드 빈도" />
        <Tab label="감정 분석" />
        <Tab label="광고 제안" />
      </Tabs>

      <Box sx={{ p: 3 }}>
        {activeTab === 0 && (
          <KeywordFrequencyChart keywords={data.keywords} />
        )}
        {activeTab === 1 && data.sentiment && (
          <SentimentAnalysis sentiment={data.sentiment} />
        )}
        {activeTab === 2 && (
          <AdSuggestions
            suggestions={adSuggestions}
            onGenerate={handleGenerateAds}
            loading={loadingAds}
          />
        )}
      </Box>
    </Box>
  );
};

export default KeywordAnalysis; 