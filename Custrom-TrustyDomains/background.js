// Escucha cuando una pestaña termina de cargar para actualizar el icono
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    updateIcon(tabId, tab.url);
  }
});

// Función para actualizar el icono según el dominio confiable
function updateIcon(tabId, url) {
  checkTrustStatus(url, (isTrusted) => {
    const iconPath = isTrusted
      ? "icons/icon-green128.png"
      : "icons/icon-red128.png";

    chrome.action.setIcon({ path: iconPath, tabId: tabId });
  });
}

// Verifica si la URL pertenece a un dominio confiable almacenado
function checkTrustStatus(url, callback) {
  const domain = extractDomain(url);
  chrome.storage.local.get({ trustedDomains: [] }, (data) => {
    const isTrusted = data.trustedDomains.includes(domain);
    callback(isTrusted);
  });
}

// Extrae solo el dominio (sin https://, www, etc.)
function extractDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch (e) {
    return "";
  }
}

// Listener para mensajes (p.ej. refrescar icono desde popup)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "refreshIcon") {
    // Obtener pestaña activa actual
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;
      const tab = tabs[0];
      if (!tab.url) return;

      updateIcon(tab.id, tab.url);
    });
  }
});
