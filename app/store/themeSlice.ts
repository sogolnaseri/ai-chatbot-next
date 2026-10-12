import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Theme = "light" | "dark";

const themeSlice = createSlice({
  name: "theme",
  initialState: "light" as Theme,
  reducers: {
    toggleTheme: (state) => (state === "light" ? "dark" : "light"),
    setTheme: (_, action: PayloadAction<Theme>) => action.payload,
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export const selectTheme = (state: { theme: Theme }) => state.theme;
export default themeSlice.reducer;
