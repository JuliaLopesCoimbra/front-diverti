import api from "../auth/axiosConfig";

const SW_URL = "/sw.js";

export interface VapidResponse {
  vapid_public_key: string;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  user_agent?: string;
}

/** Retorna a chave pública VAPID do backend (para inscrever o navegador). */
export const getVapidPublicKey = async (): Promise<string> => {
  const res = await api.get<VapidResponse>("/notifications/vapid-public-key");
  const key = res.data?.vapid_public_key;
  if (!key) throw new Error("VAPID pública não configurada no servidor.");
  return key;
};

/** Registra a assinatura Web Push no backend (após o usuário aceitar e subscribe). */
export const registerPushSubscription = async (
  subscription: PushSubscriptionPayload
): Promise<void> => {
  await api.post("/notifications/push/subscribe", subscription);
};

/** Remove a assinatura Web Push no backend. */
export const unregisterPushSubscription = async (endpoint: string): Promise<void> => {
  await api.post("/notifications/push/unsubscribe", { endpoint });
};

/**
 * Registra o Service Worker (necessário para Web Push).
 * Deve ser chamado antes de pedir permissão/inscrever.
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Seu navegador não suporta notificações push.");
  }
  const registration = await navigator.serviceWorker.register(SW_URL, { scope: "/" });
  return registration;
};

/**
 * Fluxo completo para ativar notificações no navegador:
 * 1. Registra o Service Worker
 * 2. Pede permissão ao usuário
 * 3. Obtém a chave VAPID do backend
 * 4. Inscreve o push (pushManager.subscribe)
 * 5. Envia a assinatura ao backend
 * Retorna true se tudo der certo; lança ou retorna false em caso de erro/negação.
 */
export const subscribeForPush = async (): Promise<boolean> => {
  const reg = await registerServiceWorker();
  // Espera o SW estar ativo (evita race ao inscrever)
  await navigator.serviceWorker.ready;

  if (!("Notification" in window)) {
    throw new Error("Seu navegador não suporta notificações.");
  }
  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    throw new Error("Permissão de notificação negada.");
  }

  const vapidKey = await getVapidPublicKey();
  const applicationServerKey = urlBase64ToUint8Array(vapidKey);

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey as BufferSource,
  });

  const payload: PushSubscriptionPayload = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: btoa(
        String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")!))
      ),
      auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("auth")!))),
    },
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  };

  await registerPushSubscription(payload);
  return true;
};

/**
 * Remove a inscrição de push no navegador e no backend.
 */
export const unsubscribeFromPush = async (): Promise<boolean> => {
  if (!("serviceWorker" in navigator)) return true;
  const reg = await navigator.serviceWorker.ready;
  const subscription = await reg.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
    await unregisterPushSubscription(subscription.endpoint);
  }
  return true;
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}
