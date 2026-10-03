export function mobilePlatform(search: string) {
  const platform = new URLSearchParams(search).get('vk_platform');
  return { isMobileInApp: platform === 'mobile_android' || platform === 'mobile_iphone', isMobileWeb: platform === 'mobile_web' };
}
