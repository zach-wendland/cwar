import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Culture War Tycoon",
  description: "Lead a digital movement, shape narratives, and dominate the culture before platforms shut you down.",
  keywords: ["strategy game", "culture war", "simulation", "political satire"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "transparent",
              boxShadow: "none",
              padding: 0,
            },
          }}
        />
      </body>
    </html>
  );
}
