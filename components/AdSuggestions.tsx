import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Grid
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

interface AdSuggestion {
  headline: string;
  description: string;
  target: string;
}

interface AdSuggestionsProps {
  suggestions: AdSuggestion[];
  onGenerate: () => void;
  loading: boolean;
}

const AdSuggestions: React.FC<AdSuggestionsProps> = ({ suggestions, onGenerate, loading }) => {
  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={4}>
        <CircularProgress />
        <Typography>
          광고 소재를 생성 중입니다...
          <br />
          처음 생성 시 시간이 소요될 수 있습니다.
        </Typography>
      </Box>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" gap={3} py={4}>
        <Typography variant="h6" color="text.secondary" textAlign="center">
          생성된 광고 소재가 없습니다.
          <br />
          아래 버튼을 클릭하여 광고 소재를 생성해보세요.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AutoAwesomeIcon />}
          onClick={onGenerate}
          size="large"
        >
          광고 소재 생성하기
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {suggestions.map((suggestion, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  {suggestion.headline}
                </Typography>
                <Typography variant="body1" paragraph>
                  {suggestion.description}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  타겟: {suggestion.target}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Box display="flex" justifyContent="center" mt={4}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<AutoAwesomeIcon />}
          onClick={onGenerate}
        >
          새로운 광고 소재 생성하기
        </Button>
      </Box>
    </Box>
  );
};

export default AdSuggestions; 