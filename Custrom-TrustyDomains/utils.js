const STORAGE_KEY = 'trustedDomains';

/**
 * Obtiene la lista de dominios guardada.
 * @returns {Promise<Set<string>>}
 */
function getTrustedDomains() {
  return new Promise(resolve => {
    chrome.storage.sync.get([STORAGE_KEY], result => {
      const arr = result[STORAGE_KEY] || [];
      resolve(new Set(arr));
    });
  });
}

/**
 * Guarda la lista de dominios.
 * @param {Set<string>} domainSet
 * @returns {Promise<void>}
 */
function setTrustedDomains(domainSet) {
  return new Promise(resolve => {
    const arr = Array.from(domainSet);
    chrome.storage.sync.set({ [STORAGE_KEY]: arr }, () => resolve());
  });
}