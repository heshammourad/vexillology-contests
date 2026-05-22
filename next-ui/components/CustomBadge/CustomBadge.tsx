import Badge from '@mui/material/Badge';

interface CustomBadgeProps {
  children: React.ReactNode;
  invisible?: boolean;
  overlap?: 'circular' | 'rectangular';
}

export default function CustomBadge({
  children,
  invisible = false,
  overlap = 'rectangular',
}: CustomBadgeProps) {
  return (
    <Badge
      color="primary"
      invisible={invisible}
      overlap={overlap}
      variant="dot">
      {children}
    </Badge>
  );
}
