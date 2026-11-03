import type { Metadata } from "next";
import Providers from "./providers";
import "./globals.css";
export const metadata: Metadata = {
  title: "Forma — Mini Project Manager",
  description: "A little structure. A lot of progress.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
