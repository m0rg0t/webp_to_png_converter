import bridge from "@vkontakte/vk-bridge";
import { useEffect, useState } from "react";

export type TBridgeInitializedStatus =
  | "UNKNOWN"
  | "INITIALIZED"
  | "NOT_INITIALIZED";

const useInitializeVKBridge = (): TBridgeInitializedStatus => {
  const [bridgeInitialized, setBridgeInitialized] =
    useState<TBridgeInitializedStatus>("UNKNOWN");

  useEffect(() => {
    bridge
      .send("VKWebAppInit")
      .then(() => {
        //console.log("vk bridge initialized");
        setBridgeInitialized("INITIALIZED");
      })
      .catch((error) => {
        //console.log("vk bridge NOT initialized");
        console.log(error);
        setBridgeInitialized("NOT_INITIALIZED");
      });
  }, []);

  return bridgeInitialized;
};

export default useInitializeVKBridge;
