import type { ReactNode } from "react";
import "../styles/globals.css";

export const metadata = {
  title: "Online Shop",
  description: "온라인 쇼핑몰",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
