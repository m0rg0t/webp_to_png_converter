import {SplitCol, SplitLayout, View} from '@vkontakte/vkui';
import {useActiveVkuiLocation} from '@vkontakte/vk-mini-apps-router';

import {Home} from './panels';
import {DEFAULT_VIEW_PANELS} from './routes';

export const App = () => {
  const { panel: activePanel = DEFAULT_VIEW_PANELS.HOME } = useActiveVkuiLocation();

  return (
    <SplitLayout popout={null}>
      <SplitCol>
        <View activePanel={activePanel}>
          <Home id="home" />
        </View>
      </SplitCol>
    </SplitLayout>
  );
};
