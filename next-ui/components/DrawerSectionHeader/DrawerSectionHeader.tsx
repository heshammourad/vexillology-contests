import Box from '@mui/material/Box';

interface DrawerSectionHeaderProps {
  children: string;
}

export default function DrawerSectionHeader({
  children,
}: DrawerSectionHeaderProps) {
  return (
    <Box
      sx={{
        color: (theme) => theme.palette.grey[700],
        fontSize: '0.6875rem',
        fontWeight: 500,
        letterSpacing: '0.07272727em',
        lineHeight: '1rem',
        padding: '14px 0',
        textTransform: 'uppercase',
      }}>
      {children}
    </Box>
  );
}
