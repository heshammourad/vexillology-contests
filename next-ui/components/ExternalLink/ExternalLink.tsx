import Link, {LinkProps} from '@mui/material/Link';

interface ExternalLinkProps extends LinkProps {
  children: React.ReactNode;
  href: string;
}

export default function ExternalLink({
  children,
  className,
  color = 'primary',
  href,
  target = 'vexillology-contests',
  ...props
}: ExternalLinkProps) {
  return (
    <Link
      className={className}
      color={color}
      href={href}
      rel="noopener noreferrer"
      target={target}
      {...props}>
      {children}
    </Link>
  );
}
