import ReduxProvider from "./store/ReduxProvider";
import ThemeWrapper from "./components/ThemeWrapper";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>
          <ThemeWrapper>{children}</ThemeWrapper>
        </ReduxProvider>
      </body>
    </html>
  );
}
