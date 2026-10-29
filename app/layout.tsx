import "./globals.css";
import { CartProvider } from "@/context/CartContext";

export const metadata = {
  title: "MyStore - Premium E-Commerce",
  description: "A modern, complete Shopify-inspired e-commerce platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}