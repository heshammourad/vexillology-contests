import Box from '@mui/material/Box';

interface CenteredContentProps {
  children: React.ReactNode;
}

export default function CenteredContent({children}: CenteredContentProps) {
  return (
    <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      {children}
    </Box>
  );
}
