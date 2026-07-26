import { createContext, useContext } from "react";

export const DEFAULT_APP_CONFIG = {
  allowCustomUpload:  true,
  screenerEnabled:    true,
  comparisonEnabled:  true,
  kpiEditorLocked:    false,
  screenerMaxRows:    0,
  maintenanceBanner:  "",
};

// Context holds { config, ready, refresh }.
// `ready` is false until the first successful GET /app-config response so that
// components which gate on config values (e.g. Dashboard's redirect to /screener)
// don't act on stale defaults before the real flags arrive.
export const AppConfigContext = createContext({ config: DEFAULT_APP_CONFIG, ready: false, refresh: () => {} });

export const useAppConfig = () => useContext(AppConfigContext).config;
export const useAppConfigReady = () => useContext(AppConfigContext).ready;
export const useRefreshAppConfig = () => useContext(AppConfigContext).refresh;
