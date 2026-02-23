import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PragyaX — Geospatial Intelligence System",
  description: "Advanced geospatial intelligence console",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <head>
        <link rel="stylesheet" href="/cesium/Widgets/widgets.css" />
      </head>
      <body
        className={`${jetbrainsMono.variable} font-mono-system h-full overflow-hidden bg-black text-white antialiased`}
        style={{ overscrollBehavior: 'none' }}
      >
        {children}
      </body>
    </html>
  );
}
