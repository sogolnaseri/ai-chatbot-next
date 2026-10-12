import { ThemeProvider } from "./context/ThemeContext";
import ThemeWrapper from "./components/ThemeWrapper";
import StyledComponentsRegistry from "./lib/StyledComponentsRegistry";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <ThemeProvider>
            <ThemeWrapper>{children}</ThemeWrapper>
          </ThemeProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
