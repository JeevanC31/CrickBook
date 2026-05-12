import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import "./layout.css";
import { AppProvider } from "@/context/AppContext";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CricBook - Cricket Turf & Coach Booking",
  description: "Modern web application for booking cricket turfs, coaches, and buying equipment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className={outfit.className}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
