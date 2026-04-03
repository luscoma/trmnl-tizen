// config.ts — build-time constants injected via --define in scripts/dev.ts

declare const CONFIG_API_KEY: string | undefined;
declare const CONFIG_SIMULATE_TIZEN: boolean | undefined;

const CONFIG = {
  API_KEY:        typeof CONFIG_API_KEY       !== 'undefined' ? CONFIG_API_KEY : '',
  SIMULATE_TIZEN: typeof CONFIG_SIMULATE_TIZEN !== 'undefined' && CONFIG_SIMULATE_TIZEN,
};

export default CONFIG;
