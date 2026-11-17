import "./globals.css";

export const metadata = {
  title: "메리 트리 스튜디오 | 나만의 크리스마스 트리",
  description: "나만의 PNG 오너먼트로 크리스마스 트리를 꾸며 보세요.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
