import Box from '@mui/material/Box';

interface TabPanelProps {
  children: React.ReactNode;
  currentTab: number;
  index: number;
}

export default function TabPanel({children, currentTab, index}: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={currentTab !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}>
      {currentTab === index && <Box sx={{p: 3}}>{children}</Box>}
    </div>
  );
}
