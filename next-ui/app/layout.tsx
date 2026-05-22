import type {Metadata} from 'next';
import {Roboto} from 'next/font/google';
import {AppRouterCacheProvider} from '@mui/material-nextjs/v15-appRouter';
import CustomThemeProvider from '../components/CustomThemeProvider';
import {ComponentsStateProvider} from '../context/ComponentsStateContext';
import './globals.css';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: 'Vexillology Contests',
  description:
    'Incremental migration of the vexillology contest system into modern Next.js and Material UI v9',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${roboto.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AppRouterCacheProvider>
          <CustomThemeProvider>
            <ComponentsStateProvider>{children}</ComponentsStateProvider>
          </CustomThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
