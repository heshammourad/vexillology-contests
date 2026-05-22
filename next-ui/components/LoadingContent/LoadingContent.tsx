import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

interface LoadingContentProps {
  children?: React.ReactNode;
  loading: boolean;
}

export default function LoadingContent({
  children,
  loading,
}: LoadingContentProps) {
  return loading ? (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: '100px', // Ensure a nice minimum height so it doesn't collapse
      }}>
      <CircularProgress />
    </Box>
  ) : (
    <>{children}</>
  );
}
