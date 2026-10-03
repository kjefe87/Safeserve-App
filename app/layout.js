export const metadata = {
  title: "SafeServe",
  description: "Restaurant compliance tracking",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#fafafa" }}>{children}</body>
    </html>
  );
}
