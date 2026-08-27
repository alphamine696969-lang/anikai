import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import Navbar from '@/components/ui/Navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: { default: 'AniKai – Watch Anime Online Free', template: '%s | AniKai' },
  description: 'Stream thousands of anime episodes in HD. Watch the latest anime online for free on AniKai.',
  keywords: ['anime', 'watch anime', 'anime streaming', 'free anime'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'AniKai',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#0a0a0f] text-white antialiased min-h-screen">
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
