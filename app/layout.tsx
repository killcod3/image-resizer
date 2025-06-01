import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from "@/components/theme-provider";
import { Loader } from "@/components/ui/loader";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Image Resizer - Fast, Private & Client-Side',
  description: 'Resize and compress your images directly in your browser with no uploads',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Loader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}