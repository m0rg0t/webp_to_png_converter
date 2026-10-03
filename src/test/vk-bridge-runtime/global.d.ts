import type { vkBridgeMockController } from './vkBridgeRuntimeMock';

declare global {
  interface Window {
    __VK_BRIDGE_MOCK__?: typeof vkBridgeMockController;
  }
}

export {};

