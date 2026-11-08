import type { Metadata, Viewport } from "next";
import { StylePicker } from "@/components/ui/StylePicker";
import { prePaintScript } from "@/themes/registry";
import { ThemeRuntime } from "@/themes/ThemeRuntime";
import "./globals.css";

export const metadata: Metadata = {
  title: "LarpParty",
  description: "Party games for one big screen and everyone's phones.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // data-style is set before first paint by the inline script, so React must not fight it.
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <script dangerouslySetInnerHTML={{ __html: prePaintScript() }} />
      </head>
      <body>
        {children}
        <StylePicker />
        <ThemeRuntime />
      </body>
    </html>
  );
}
