export const metadata = {
  title: "Stock Analyzer",
  description: "Company Score Card for 2+ Years",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
