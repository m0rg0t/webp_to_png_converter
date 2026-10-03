import {
  failure,
  isVkMockScenario,
  type VkMockScenarioName,
} from './scenarios';

type Listener = (event: { detail: { type: string; data: unknown } }) => void;
type BridgeCall = { method: string; params?: Record<string, unknown> };

const listeners = new Set<Listener>();
const calls: BridgeCall[] = [];
const storage = new Map<string, string>();
const checkedStorageKey = (method: string, key: unknown): string => {
  if (typeof key !== 'string' || key.length === 0 || /[^A-Za-z0-9_-]/.test(key)) {
    throw failure(method, 1, 'Invalid VK Storage key in mock: use Latin letters, digits, _ or -');
  }
  return key;
};

const initialScenario = (): VkMockScenarioName => {
  if (typeof window === 'undefined') return 'success';
  const requested = new URLSearchParams(window.location.search).get('vk_mock');
  return isVkMockScenario(requested) ? requested : 'success';
};

let scenario = initialScenario();

const emit = (type: string, data: unknown): void => {
  const event = { detail: { type, data } };
  listeners.forEach((listener) => listener(event));
};

const rejectForScenario = (method: string): never | void => {
  if (
    scenario === 'permission-declined' &&
    ['VKWebAppGetEmail', 'VKWebAppGetPhoneNumber', 'VKWebAppAllowNotifications'].includes(method)
  ) {
    throw failure(method, 4, 'User denied the request');
  }

  if (
    scenario === 'ads-unavailable' &&
    [
      'VKWebAppShowNativeAds',
      'VKWebAppShowBannerAd',
      'VKWebAppCheckNativeAds',
      'VKWebAppCheckBannerAd',
    ].includes(method)
  ) {
    throw failure(method, 6, 'Ads are unavailable in this environment');
  }

  if (
    scenario === 'storage-error' &&
    ['VKWebAppStorageGet', 'VKWebAppStorageSet'].includes(method)
  ) {
    throw failure(method, 1, 'Storage request failed');
  }
};

const send = async (
  method: string,
  params: Record<string, unknown> = {},
): Promise<unknown> => {
  calls.push({ method, params });
  if (scenario === 'init-unavailable' && method === 'VKWebAppInit') throw failure(method, 6, 'Synthetic init unavailable');
  if (scenario === 'user-info-unavailable' && method === 'VKWebAppGetUserInfo') throw failure(method, 6, 'Synthetic user info unavailable');
  if (scenario === 'user-info-timeout' && method === 'VKWebAppGetUserInfo') return new Promise(() => {});
  rejectForScenario(method);

  switch (method) {
    case 'VKWebAppSetLocation':
    case 'VKWebAppSetSwipeSettings':
    case 'VKWebAppEnableSwipeBack':
    case 'VKWebAppDisableSwipeBack':
      return { result: true };
    case 'VKWebAppGetConfig':
      return { appearance: scenario === 'dark' ? 'dark' : 'light', scheme: scenario === 'dark' ? 'space_gray' : 'client_light', insets: { top: 0, right: 0, bottom: 0, left: 0 } };
    case 'VKWebAppInit':
      queueMicrotask(() =>
        emit('VKWebAppUpdateConfig', {
          scheme: scenario === 'dark' ? 'space_gray' : 'client_light',
          appearance: scenario === 'dark' ? 'dark' : 'light',
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }),
      );
      return {};
    case 'VKWebAppGetUserInfo':
      return {
        id: 42,
        first_name: 'Test',
        last_name: 'User',
        sex: 0,
        city: { id: 1, title: 'Moscow' },
        country: { id: 1, title: 'Russia' },
        photo_100: 'https://example.test/avatar.png',
        photo_200: 'https://example.test/avatar@2x.png',
        timezone: 3,
      };
    case 'VKWebAppGetLaunchParams':
      return {
        vk_app_id: 1,
        vk_user_id: 42,
        vk_language: 'ru',
        vk_platform: 'desktop_web',
        vk_is_app_user: 1,
        vk_are_notifications_enabled: 0,
        vk_access_token_settings: '',
        vk_is_favorite: 0,
        vk_ts: 1_700_000_000,
        sign: 'mock-signature-not-for-authentication',
        vk_ref: 'mock',
      };
    case 'VKWebAppStorageSet': {
      const key = checkedStorageKey(method, params.key);
      storage.set(key, String(params.value ?? ''));
      return { result: true };
    }
    case 'VKWebAppStorageGet': {
      const keys = (Array.isArray(params.keys) ? params.keys : []).map((key) =>
        checkedStorageKey(method, key),
      );
      return {
        keys: keys.map((key) => ({ key, value: storage.get(key) ?? '' })),
      };
    }
    case 'VKWebAppStorageGetKeys':
      return { keys: [...storage.keys()] };
    case 'VKWebAppShare':
      return [{ type: 'link' }];
    case 'VKWebAppShowStoryBox':
      return { result: true };
    case 'VKWebAppAllowNotifications':
    case 'VKWebAppAddToFavorites':
    case 'VKWebAppShowNativeAds':
      return { result: true };
    case 'VKWebAppCheckNativeAds':
      return { result: true };
    case 'VKWebAppShowBannerAd':
    case 'VKWebAppCheckBannerAd':
    case 'VKWebAppHideBannerAd':
      return {
        result: true,
        banner_width: 320,
        banner_height: 64,
        banner_location: params.banner_location === 'top' ? 'top' : 'bottom',
        banner_align: params.banner_align ?? 'center',
        layout_type: params.layout_type === 'overlay' ? 'overlay' : 'resize',
        height_type: params.height_type === 'compact' ? 'compact' : 'regular',
        orientation: params.orientation === 'vertical' ? 'vertical' : 'horizontal',
      };
    case 'VKWebAppGetEmail':
      return { email: 'test@example.test', sign: 'mock-signature' };
    case 'VKWebAppGetPhoneNumber':
      return { phone_number: '+70000000000', sign: 'mock-signature' };
    default:
      throw failure(method, 12, `Unsupported method in runtime mock: ${method}`);
  }
};

const subscribe = (listener: Listener): void => {
  listeners.add(listener);
};

const unsubscribe = (listener: Listener): void => {
  listeners.delete(listener);
};

export const vkBridgeMockController = {
  get scenario(): VkMockScenarioName {
    return scenario;
  },
  get calls(): readonly BridgeCall[] {
    return calls;
  },
  setScenario(next: VkMockScenarioName): void {
    if (!isVkMockScenario(next)) throw new Error(`Unknown VK mock scenario: ${next}`);
    scenario = next;
  },
  emit,
  reset(): void {
    scenario = initialScenario();
    calls.length = 0;
    storage.clear();
  },
};

const supportedMethods = new Set([
  'VKWebAppSetLocation',
  'VKWebAppSetSwipeSettings',
  'VKWebAppEnableSwipeBack',
  'VKWebAppDisableSwipeBack',
  'VKWebAppGetConfig',
  'VKWebAppInit',
  'VKWebAppGetUserInfo',
  'VKWebAppGetLaunchParams',
  'VKWebAppStorageSet',
  'VKWebAppStorageGet',
  'VKWebAppStorageGetKeys',
  'VKWebAppShare',
  'VKWebAppShowStoryBox',
  'VKWebAppAllowNotifications',
  'VKWebAppAddToFavorites',
  'VKWebAppShowNativeAds',
  'VKWebAppCheckNativeAds',
  'VKWebAppShowBannerAd',
  'VKWebAppCheckBannerAd',
  'VKWebAppHideBannerAd',
  'VKWebAppGetEmail',
  'VKWebAppGetPhoneNumber',
]);
const supports = (method: string): boolean => supportedMethods.has(method);

const bridge = {
  send,
  sendPromise: send,
  subscribe,
  unsubscribe,
  supports,
  supportsAsync: async (method: string): Promise<boolean> => supports(method),
  isWebView: () => false,
  isIframe: () => false,
  isEmbedded: () => false,
  isStandalone: () => true,
};

if (typeof window !== 'undefined') {
  Object.assign(window, { __VK_BRIDGE_MOCK__: vkBridgeMockController });
}

export const parseURLSearchParamsForGetLaunchParams = (search: string): Record<string, unknown> => {
  const params = new URLSearchParams(search);
  const result = Object.fromEntries(params.entries());
  if (!('vk_scheme' in result)) result.vk_scheme = params.get('vk_mock') === 'dark' ? 'space_gray' : 'client_light';
  return result;
};

export default bridge;

