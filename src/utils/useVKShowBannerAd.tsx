import { useEffect } from "react";
import bridge, { BannerAdLocation } from "@vkontakte/vk-bridge";
import { TBridgeInitializedStatus } from "./useInitializeVKBrdige";

const useShowVKBannerAds = (vkBridgeStatus: TBridgeInitializedStatus) => {
  useEffect(() => {
    if (vkBridgeStatus === "INITIALIZED") {
      bridge.send("VKWebAppInit").then(() => {
        bridge
          .send("VKWebAppShowBannerAd", {
            banner_location: BannerAdLocation.BOTTOM,
          })
          .then((data) => {
            if (data.result) {
              // Баннерная реклама отобразилась
              console.log("show banner ad", data);
            }
          })
          .catch((error) => {
            // Ошибка
            console.log(error);
          });
      });
    }
  }, [vkBridgeStatus]);
};

export default useShowVKBannerAds;
