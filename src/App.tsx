import {SplitCol, SplitLayout, View} from '@vkontakte/vkui';
import {useActiveVkuiLocation} from '@vkontakte/vk-mini-apps-router';

import {Home} from './panels';
import {DEFAULT_VIEW_PANELS} from './routes';
import useInitializeVKBridge from './utils/useInitializeVKBrdige';
import useShowVKBannerAds from './utils/useVKShowBannerAd';

export const App = () => {
  const { panel: activePanel = DEFAULT_VIEW_PANELS.HOME } = useActiveVkuiLocation();

  const vkBridgeStatus = useInitializeVKBridge();
  useShowVKBannerAds(vkBridgeStatus);

  //check get param vk_platform and if its include words iphone, android, mobile - then its mobile mode
  const mobileWords = ['iphone', 'android']; //, 'mobile'];
  const isMobileInApp = mobileWords.some((word) => window.location.search.includes(word));
  //mobile_web
  const isMobileWeb = window.location.search.includes("mobile_web");

  return (
    <SplitLayout popout={null}>
      <SplitCol>
        <View activePanel={activePanel}>
          <Home id="home" isMobileInApp={isMobileInApp} isMobileWeb={isMobileWeb} />
        </View>
      </SplitCol>
    </SplitLayout>
  );
};
