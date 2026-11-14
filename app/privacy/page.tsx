import type { Metadata } from "next";
import { PrivacyContent } from "@/features/campaign/components/privacy-content";

export const metadata: Metadata = {
  title: "隐私声明 · 起初的心",
  description: "了解起初的心活动如何收集、使用及保护参与者资料。",
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
