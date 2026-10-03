import { useEffect } from "react";
import bridge from "@vkontakte/vk-bridge";
import { TBridgeInitializedStatus } from "./useInitializeVKBrdige";

const useShowVKBannerAds = (vkBridgeStatus: TBridgeInitializedStatus) => {
  useEffect(() => {
    if (vkBridgeStatus === "INITIALIZED") {
      void bridge
          .send("VKWebAppShowBannerAd", {
            banner_location: "bottom",
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
    }
  }, [vkBridgeStatus]);
};

export default useShowVKBannerAds;
