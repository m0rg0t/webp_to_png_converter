import {SplitCol, SplitLayout, View} from '@vkontakte/vkui';
import {useActiveVkuiLocation} from '@vkontakte/vk-mini-apps-router';

import {Home} from './panels';
import {DEFAULT_VIEW_PANELS} from './routes';
import useInitializeVKBridge from './utils/useInitializeVKBrdige';
import useShowVKBannerAds from './utils/useVKShowBannerAd';
import './main.css';
import { mobilePlatform } from './utils/platform';

export const App = () => {
  const { panel: activePanel = DEFAULT_VIEW_PANELS.HOME } = useActiveVkuiLocation();

  const vkBridgeStatus = useInitializeVKBridge();
  useShowVKBannerAds(vkBridgeStatus);

  const { isMobileInApp, isMobileWeb } = mobilePlatform(window.location.search);

  return (
    <SplitLayout>
      <SplitCol>
        <View activePanel={activePanel}>
          <Home id="home" isMobileInApp={isMobileInApp} isMobileWeb={isMobileWeb} />
        </View>
      </SplitCol>
    </SplitLayout>
  );
};
