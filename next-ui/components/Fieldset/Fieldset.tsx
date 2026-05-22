import Box from '@mui/material/Box';

interface FieldsetProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function Fieldset({
  children,
  className,
  disabled = false,
}: FieldsetProps) {
  return (
    <Box
      component="fieldset"
      className={className}
      disabled={disabled}
      sx={{
        border: 0,
        display: 'flex',
        flexDirection: 'column',
        margin: 0,
        minWidth: 0,
        padding: 0,
        gap: 2, // theme.spacing(2)
      }}>
      {children}
    </Box>
  );
}
