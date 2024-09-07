import bridge from "@vkontakte/vk-bridge";
import { useState, useEffect } from "react";
import { TBridgeInitializedStatus } from "./useInitializeVKBrdige";

const useVKShowOnboarding = (vkBridgeStatus: TBridgeInitializedStatus) => {
  const [isOnboardingShown, setIsOnboardingShown] = useState(false);

  useEffect(() => {
    if (vkBridgeStatus) {
      const isOnboardingShown = localStorage.getItem("isOnboardingShown");
      if (!isOnboardingShown) {
        setIsOnboardingShown(true);
        localStorage.setItem("isOnboardingShown", "true");

        bridge
          .send("VKWebAppShowSlidesSheet", {
            slides: [
              {
                media: {
                  blob: "data:image/png;base64,[IMAGE_DATA]",
                  type: "image",
                },
                title: "WEBP в PNG",
                subtitle:
                  "Загружайте ваши WEBP изображения и конвертируйте их в PNG. Ваши изображения никуда не передаются и в полной безопасности",
              },
            ],
          })
          .then((data) => {
            if (data.result) {
              // Слайды показаны
            }
          })
          .catch((error) => {
            // Ошибка
            console.log(error);
          });
      }
    }
  }, [vkBridgeStatus]);

  return isOnboardingShown;
};

export default useVKShowOnboarding;
