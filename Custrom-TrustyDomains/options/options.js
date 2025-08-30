function renderList(domains) {
  const list = document.getElementById("domainList");
  list.innerHTML = "";
  domains.forEach((domain, index) => {
    const li = document.createElement("li");
    li.textContent = domain;
    const btn = document.createElement("button");
    btn.textContent = "Eliminar";
    btn.onclick = () => {
      domains.splice(index, 1);
      chrome.storage.local.set({ trustedDomains: domains }, () => renderList(domains));
    };
    li.appendChild(btn);
    list.appendChild(li);
  });
}

document.getElementById("addBtn").addEventListener("click", () => {
  const input = document.getElementById("newDomain");
  const newDomain = input.value.trim().replace(/^www\./, "");
  if (!newDomain) return;

  chrome.storage.local.get({ trustedDomains: [] }, (data) => {
    if (!data.trustedDomains.includes(newDomain)) {
      data.trustedDomains.push(newDomain);
      chrome.storage.local.set({ trustedDomains: data.trustedDomains }, () => {
        input.value = "";
        renderList(data.trustedDomains);
      });
    }
  });
});

chrome.storage.local.get({ trustedDomains: [] }, (data) => {
  renderList(data.trustedDomains);
});
