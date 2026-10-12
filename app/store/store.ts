import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./themeSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      theme: themeReducer,
    },
  });

export const store = makeStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
