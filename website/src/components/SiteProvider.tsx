"use client";

import { createContext, useContext } from "react";

const SiteContext = createContext<any>({});

export function SiteProvider({ site, children }: { site: any; children: React.ReactNode }) {
  return <SiteContext.Provider value={site || {}}>{children}</SiteContext.Provider>;
}

export function useSite() {
  return useContext(SiteContext);
}
