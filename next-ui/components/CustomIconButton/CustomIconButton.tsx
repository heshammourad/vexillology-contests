import IconButton from '@mui/material/IconButton';
import React from 'react';

interface CustomIconButtonProps {
  ariaLabel: string;
  className?: string;
  color?:
    | 'inherit'
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning';
  href?: string;
  Icon: React.ComponentType;
  innerRef?: React.Ref<HTMLButtonElement>;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  size?: 'small' | 'medium' | 'large';
}

export default function CustomIconButton({
  ariaLabel,
  className,
  color = 'inherit',
  href,
  Icon,
  innerRef,
  onClick,
  size = 'medium',
}: CustomIconButtonProps) {
  const target = href ? 'vexillology-contests' : undefined;
  const linkProps = href ? {href, target} : {};

  return (
    <IconButton
      component={href ? 'a' : 'button'}
      aria-label={ariaLabel}
      className={className}
      color={color}
      onClick={onClick}
      ref={innerRef}
      size={size}
      {...linkProps}>
      <Icon />
    </IconButton>
  );
}
