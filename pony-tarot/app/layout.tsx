import type { Metadata } from 'next';
import './globals.css';
// Per-request rendering lets APP_ORIGIN (set on the server) resolve share-image URLs.
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_ORIGIN ?? 'http://localhost:3000'),
  title: '小马利亚魔法塔罗 · 循着星光，听见心的回响',
  description: '走进温柔的小马镇，抽一张今日指引，或让三张塔罗牌陪你整理心里的问题。免费，无需登录。',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
