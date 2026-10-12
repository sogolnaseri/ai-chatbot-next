import React, { useRef, ReactNode } from "react";
import { Provider } from "react-redux";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import { makeStore } from "../store/store";
import { lightTheme } from "../styles/theme";
import { ChatProvider } from "../context/ChatContext";

interface TestWrapperProps {
  children: ReactNode;
}

const TestWrapper: React.FC<TestWrapperProps> = ({ children }) => {
  const storeRef = useRef(makeStore());
  return (
    <Provider store={storeRef.current}>
      <StyledThemeProvider theme={lightTheme}>
        <ChatProvider>{children}</ChatProvider>
      </StyledThemeProvider>
    </Provider>
  );
};

export default TestWrapper;
