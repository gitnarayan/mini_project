"use client";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { useState } from "react";
import { api } from "@/store/api";
export default function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(() =>
    configureStore({
      reducer: { [api.reducerPath]: api.reducer },
      middleware: (g) => g().concat(api.middleware),
    }),
  );
  return <Provider store={store}>{children}</Provider>;
}
