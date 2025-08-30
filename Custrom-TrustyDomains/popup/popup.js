document.addEventListener("DOMContentLoaded", () => {
  const statusDiv = document.getElementById("status");
  const addButton = document.getElementById("addDomain");
  const showButton = document.getElementById("showDomains");
  const updateButton = document.getElementById("updateFromOnline");
  const clearAllButton = document.getElementById("clearAllDomains");
  const domainList = document.getElementById("domainList");

  // Obtener pestaña activa
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      statusDiv.textContent = "No se pudo obtener la URL activa.";
      return;
    }

    const url = tabs[0].url;
    const domain = getDomainFromUrl(url);

    chrome.storage.local.get({ trustedDomains: [] }, (data) => {
      const trustedDomains = data.trustedDomains || [];
      const isTrusted = trustedDomains.includes(domain);

      statusDiv.innerHTML = isTrusted
        ? `<span class="trusted">${domain} es confiable</span>`
        : `<span class="untrusted">${domain} NO es confiable</span>`;

      addButton.style.display = isTrusted ? "none" : "inline-block";

      addButton.onclick = () => {
        if (!trustedDomains.includes(domain)) {
          trustedDomains.push(domain);
          chrome.storage.local.set({ trustedDomains }, () => {
            statusDiv.innerHTML = `<span class="trusted">${domain} fue agregado como confiable</span>`;
            addButton.style.display = "none";
            chrome.runtime.sendMessage({ action: "refreshIcon" });
          });
        }
      };
    });
  });

  // Mostrar lista de dominios confiables con botón eliminar
  showButton.addEventListener("click", () => {
    chrome.storage.local.get({ trustedDomains: [] }, (data) => {
      const trustedDomains = data.trustedDomains || [];
      domainList.innerHTML = "";

      if (trustedDomains.length === 0) {
        domainList.innerHTML = "<li><i>No hay dominios confiables guardados.</i></li>";
        return;
      }

      trustedDomains.forEach((domain) => {
        const li = document.createElement("li");
        li.textContent = domain + " ";

        const btnEliminar = document.createElement("button");
        btnEliminar.textContent = "Eliminar";
        btnEliminar.style.marginLeft = "10px";
        btnEliminar.addEventListener("click", () => {
          eliminarDominio(domain);
        });

        li.appendChild(btnEliminar);
        domainList.appendChild(li);
      });
    });
  });

  // Actualizar lista desde URL personalizada que apunta a archivo .txt
  updateButton.addEventListener("click", () => {
    const userUrl = prompt("Introduce la URL del archivo TXT con la lista de dominios:");

    if (!userUrl) {
      alert("No se introdujo ninguna URL.");
      return;
    }

    fetch(userUrl)
      .then(response => {
        if (!response.ok) throw new Error("Error al descargar la lista");
        return response.text();
      })
      .then(text => {
        const lines = text.split(/\r?\n/);
        const dominios = [];

        for (let line of lines) {
          line = line.trim().toLowerCase();
          if (line && esDominioValido(line)) {
            dominios.push(line);
          }
        }

        if (dominios.length === 0) {
          alert("No se encontraron dominios válidos en la lista.");
          return;
        }

        chrome.storage.local.get({ trustedDomains: [] }, (data) => {
          const actuales = new Set(data.trustedDomains);
          dominios.forEach(d => actuales.add(d));
          const nuevos = Array.from(actuales);

          chrome.storage.local.set({ trustedDomains: nuevos }, () => {
            alert(`Se agregaron ${dominios.length} dominios de la lista online.`);
          });
        });
      })
      .catch(err => {
        alert("Error al descargar o procesar la lista: " + err.message);
      });
  });

  // Eliminar todos los dominios confiables
  clearAllButton.addEventListener("click", () => {
    if (confirm("¿Seguro que quieres eliminar TODOS los dominios confiables?")) {
      chrome.storage.local.set({ trustedDomains: [] }, () => {
        alert("Todos los dominios confiables han sido eliminados.");
        domainList.innerHTML = "";
        statusDiv.textContent = "";
        chrome.runtime.sendMessage({ action: "refreshIcon" });
      });
    }
  });

});

// Función para eliminar un dominio
function eliminarDominio(domain) {
  chrome.storage.local.get({ trustedDomains: [] }, (data) => {
    const trustedDomains = data.trustedDomains || [];
    const nuevos = trustedDomains.filter(d => d !== domain);

    chrome.storage.local.set({ trustedDomains: nuevos }, () => {
      alert(`Dominio "${domain}" eliminado.`);
      // Actualizar la lista visible
      document.getElementById("showDomains").click();
      chrome.runtime.sendMessage({ action: "refreshIcon" });
    });
  });
}

// Función para extraer dominio limpio de URL
function getDomainFromUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch (e) {
    return "";
  }
}

// Validar que el texto es un dominio simple válido (muy básico)
function esDominioValido(domain) {
  return /^[a-z0-9.-]+\.[a-z]{2,6}$/.test(domain);
}
