import type { Metadata } from "next";
import { Nunito } from 'next/font/google';
import Nav from './components/Nav';
import "./globals.css";

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: "Math Fun!",
  description: "Fun math practice for 4th graders!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`min-h-full flex flex-col ${nunito.className}`}>
        <Nav />
        <main className="flex-1 p-6">{children}</main>
      </body>
    </html>
  );
}
