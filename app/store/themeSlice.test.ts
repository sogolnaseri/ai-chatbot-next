import { configureStore } from "@reduxjs/toolkit";
import themeReducer, { toggleTheme, setTheme, selectTheme } from "./themeSlice";

describe("themeSlice", () => {
  it("has a default state of light", () => {
    expect(themeReducer(undefined, { type: "@@INIT" })).toBe("light");
  });

  it("toggles from light to dark", () => {
    expect(themeReducer("light", toggleTheme())).toBe("dark");
  });

  it("toggles from dark to light", () => {
    expect(themeReducer("dark", toggleTheme())).toBe("light");
  });

  it("sets theme via setTheme", () => {
    expect(themeReducer("light", setTheme("dark"))).toBe("dark");
    expect(themeReducer("dark", setTheme("light"))).toBe("light");
  });

  it("selectTheme reads current theme from store state", () => {
    const testStore = configureStore({ reducer: { theme: themeReducer } });
    expect(selectTheme(testStore.getState())).toBe("light");
    testStore.dispatch(toggleTheme());
    expect(selectTheme(testStore.getState())).toBe("dark");
  });
});
