import React, { ReactNode } from "react";
import { ChatProvider } from "../context/ChatContext";

// Define Props Type for children
interface TestWrapperProps {
  children: ReactNode;
}

const TestWrapper: React.FC<TestWrapperProps> = ({ children }) => {
  return <ChatProvider>{children}</ChatProvider>;
};

export default TestWrapper;
