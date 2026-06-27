import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Math Practice - 4th Grade",
  description: "Fun math practice for 4th graders!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <nav className="bg-white shadow-sm border-b-4 border-blue-400 px-6 py-3 flex items-center gap-6">
          <a href="/" className="text-2xl font-bold text-blue-600">🧮 Math Fun!</a>
          <a href="/practice" className="text-blue-500 font-semibold hover:text-blue-700">Practice</a>
          <a href="/report" className="text-blue-500 font-semibold hover:text-blue-700">Reports</a>
        </nav>
        <main className="flex-1 p-6">{children}</main>
        <footer className="text-center py-3 text-gray-400 text-sm">Keep learning! 🌟</footer>
      </body>
    </html>
  );
}
