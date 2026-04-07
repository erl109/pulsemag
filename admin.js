const CATEGORY_TAXONOMY = {
  Sport: ["Futboll", "NBA", "Tennis", "Formula 1", "Te tjera"],
  Teknologji: ["AI", "Smartphones", "IT Universe", "Apps & Software", "Gaming", "Te ndryshme"],
  Lifestyle: ["Moda", "Shendet", "Udhetime", "Marredhenie", "Horoskop"],
  Kulture: ["Libra", "Art", "Teater", "Evente"],
  Argetim: ["Kinema", "TV & Showbiz", "Celebrities", "Influencers", "Muzike"],
};

const LEGACY_CATEGORY_REDIRECTS = {
  Moda: { category: "Lifestyle", subcategory: "Moda" },
  Horoskop: { category: "Lifestyle", subcategory: "Horoskop" },
  Kinema: { category: "Argetim", subcategory: "Kinema" },
  "Celebrities&Influencers": { category: "Argetim", subcategory: "Celebrities" },
};

const CATEGORY_OPTIONS = Object.keys(CATEGORY_TAXONOMY);
const AUTOMATION_ROW_COUNT = 30;

function normalizeCategorySelection(categoryValue = "", subcategoryValue = "") {
  const redirect = LEGACY_CATEGORY_REDIRECTS[categoryValue];
  if (!redirect) {
    return { category: categoryValue || "Sport", subcategory: subcategoryValue || "" };
  }

  return {
    category: redirect.category,
    subcategory: subcategoryValue || redirect.subcategory || "",
  };
}

const form = document.getElementById("post-form");
const banner = document.getElementById("config-banner");
const result = document.getElementById("result");
const submitButton = document.getElementById("submit-button");
const categorySelect = document.getElementById("category");
const subcategoryField = document.getElementById("subcategory-field");
const subcategorySelect = document.getElementById("subcategory");

const automationForm = document.getElementById("automation-form");
const automationStepsRoot = document.getElementById("automation-steps");
const automationStartButton = document.getElementById("automation-start-button");
const automationStopButton = document.getElementById("automation-stop-button");
const automationState = document.getElementById("automation-state");
const automationStatusBadge = document.getElementById("automation-status-badge");
const presetNameInput = document.getElementById("preset-name");
const presetSelect = document.getElementById("preset-select");
const savePresetButton = document.getElementById("save-preset-button");
const loadPresetButton = document.getElementById("load-preset-button");

function showResult(type, html) {
  result.hidden = false;
  result.className = `result ${type}`;
  result.innerHTML = html;
}

function getSubcategoryOptions(category) {
  return CATEGORY_TAXONOMY[category] || [];
}

function formatTimestamp(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("sq-AL");
}

function buildSelectOptions(values, placeholder = "") {
  return values
    .map((value) => {
      const label = value || placeholder;
      return `<option value="${value}">${label}</option>`;
    })
    .join("");
}

function populateSubcategorySelect(selectElement, category, currentValue = "") {
  const options = getSubcategoryOptions(category);
  selectElement.innerHTML = buildSelectOptions(["", ...options], "Zgjidh nenkategorine");
  selectElement.value = options.includes(currentValue) ? currentValue : "";
}

function syncCategoryFields(categoryValue, fieldElement, selectElement) {
  const options = getSubcategoryOptions(categoryValue);
  fieldElement.hidden = options.length === 0;
  populateSubcategorySelect(selectElement, categoryValue, selectElement.value);

  if (!options.length) {
    selectElement.value = "";
  }
}

function syncManualSubcategory() {
  syncCategoryFields(categorySelect.value, subcategoryField, subcategorySelect);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Leximi i fotos deshtoi."));
    reader.readAsDataURL(file);
  });
}

function createAutomationRow(index) {
  const wrapper = document.createElement("div");
  wrapper.className = "automation-step-row";
  wrapper.innerHTML = `
    <div class="automation-step-top">
      <strong>Hapi ${index + 1}</strong>
    </div>
    <label class="step-field">
      <span>Kategoria</span>
      <select class="step-category">
        ${buildSelectOptions(CATEGORY_OPTIONS)}
      </select>
    </label>
    <label class="step-field step-subcategory-field" hidden>
      <span>Nenkategoria</span>
      <select class="step-subcategory">
        <option value="">Zgjidh nenkategorine</option>
      </select>
    </label>
    <label class="step-field">
      <span>Pas sa minutash</span>
      <input class="step-delay" type="number" min="1" value="${index === 0 ? 30 : 60}">
    </label>
    <label class="step-field">
      <span>Statusi</span>
      <select class="step-status">
        <option value="draft">Ruaj si draft</option>
        <option value="publish">Publiko direkt</option>
      </select>
    </label>
    <label class="step-field">
      <span>Foto</span>
      <select class="step-image">
        <option value="off">OFF</option>
        <option value="on">ON</option>
      </select>
    </label>
    <label class="step-toggle">
      <input class="step-enabled" type="checkbox" ${index === 0 ? "checked" : ""}>
      <span>Aktivizo kete hap</span>
    </label>
  `;

  const category = wrapper.querySelector(".step-category");
  const stepSubcategoryField = wrapper.querySelector(".step-subcategory-field");
  const stepSubcategorySelect = wrapper.querySelector(".step-subcategory");

  const sync = () => syncCategoryFields(category.value, stepSubcategoryField, stepSubcategorySelect);
  category.addEventListener("change", sync);
  sync();

  return wrapper;
}

function renderAutomationRows() {
  for (let index = 0; index < AUTOMATION_ROW_COUNT; index += 1) {
    automationStepsRoot.appendChild(createAutomationRow(index));
  }
}

function applyStepsToForm(steps = []) {
  const rows = Array.from(automationStepsRoot.querySelectorAll(".automation-step-row"));

  rows.forEach((row, index) => {
    const step = steps[index];
    const enabled = row.querySelector(".step-enabled");
    const category = row.querySelector(".step-category");
    const stepSubcategory = row.querySelector(".step-subcategory");
    const delay = row.querySelector(".step-delay");
    const status = row.querySelector(".step-status");
    const image = row.querySelector(".step-image");
    const stepSubcategoryField = row.querySelector(".step-subcategory-field");

    if (step) {
      const normalizedSelection = normalizeCategorySelection(
        step.category || "Sport",
        step.subcategory || step.sportSubcategory || step.technologySubcategory || ""
      );
      const selectedCategory = normalizedSelection.category;
      const selectedSubcategory = normalizedSelection.subcategory;
      enabled.checked = true;
      category.value = selectedCategory;
      delay.value = step.delayMinutes || 30;
      status.value = step.status || "draft";
      image.value = step.generateImage ? "on" : "off";
      syncCategoryFields(selectedCategory, stepSubcategoryField, stepSubcategory);
      stepSubcategory.value = getSubcategoryOptions(selectedCategory).includes(selectedSubcategory) ? selectedSubcategory : "";
    } else {
      enabled.checked = index === 0;
      category.value = "Sport";
      delay.value = index === 0 ? 30 : 60;
      status.value = "draft";
      image.value = "off";
      syncCategoryFields("Sport", stepSubcategoryField, stepSubcategory);
      stepSubcategory.value = "";
    }
  });
}

function collectAutomationSteps() {
  return Array.from(automationStepsRoot.querySelectorAll(".automation-step-row"))
    .map((row) => {
      const normalizedSelection = normalizeCategorySelection(
        row.querySelector(".step-category").value,
        row.querySelector(".step-subcategory").value
      );

      return {
        enabled: row.querySelector(".step-enabled").checked,
        category: normalizedSelection.category,
        subcategory: normalizedSelection.subcategory,
        delayMinutes: Number(row.querySelector(".step-delay").value || 30),
        status: row.querySelector(".step-status").value,
        generateImage: row.querySelector(".step-image").value === "on",
      };
    })
    .filter((step) => step.enabled);
}

function renderAutomationState(data) {
  const facebookStatus = data.lastResult?.facebook?.published
    ? "Facebook: u publikua me sukses."
    : data.lastResult?.facebook?.enabled
      ? `Facebook: ${data.lastResult.facebook.error || data.lastResult.facebook.reason || "nuk u publikua."}`
      : "Facebook: autopost joaktiv.";

  const lastResultHtml = data.lastResult
    ? `Postimi i fundit: <a href="${data.lastResult.link}" target="_blank" rel="noreferrer">${data.lastResult.title}</a><br><strong>${facebookStatus}</strong>`
    : "Nuk ka ende postim automatik te kryer.";

  const stepLines = (data.steps || [])
    .slice(0, AUTOMATION_ROW_COUNT)
    .map(
      (step, index) =>
        `${index + 1}. ${step.summary} | ${step.delayMinutes} min | ${step.status === "publish" ? "publish" : "draft"} | foto ${step.generateImage ? "ON" : "OFF"}`
    )
    .join("<br>");

  automationStatusBadge.textContent = data.running ? "Aktiv" : "Ndalur";
  automationStatusBadge.className = data.running ? "status-badge active" : "status-badge idle";
  automationStopButton.disabled = !data.running && !data.inFlight;
  automationStartButton.disabled = false;

  automationState.className = data.lastError ? "config-banner error" : data.running ? "config-banner ready" : "config-banner";
  automationState.innerHTML = `
    <strong>Gjendja:</strong> ${data.running ? "Agjenti eshte aktiv" : "Agjenti eshte i ndalur"}<br>
    <strong>Hapi aktual:</strong> ${data.currentStep ? data.summary : "Pa plan aktiv"}<br>
    <strong>Numri i hapave:</strong> ${data.totalSteps || 0}<br>
    <strong>Modeli AI:</strong> ${data.aiReady ? "Gemini gati" : "mungon GEMINI_API_KEY"}<br>
    <strong>Foto automatike:</strong> ${data.imageReady ? "Pexels gati" : "mungon PEXELS_API_KEY"}<br>
    <strong>Ekzekutimi i fundit:</strong> ${formatTimestamp(data.lastRunAt)}<br>
    <strong>Ekzekutimi i radhes:</strong> ${formatTimestamp(data.nextRunAt)}<br>
    <strong>Rezultati:</strong> ${lastResultHtml}
    ${data.lastError ? `<br><strong>Gabimi i fundit:</strong> ${data.lastError}` : ""}
    ${stepLines ? `<br><br><strong>Plani aktiv:</strong><br>${stepLines}` : ""}
  `;
}

async function loadStatus() {
  try {
    const response = await fetch("/api/publisher-status");
    const data = await response.json();
    if (!data.configured) {
      if (data.oauthReady && data.authorizeUrl) {
        banner.className = "config-banner error";
        banner.innerHTML = `Paneli s'eshte lidhur ende me WordPress.com. <a href="${data.authorizeUrl}">Lidhu tani</a>. Site aktiv: <strong>${data.site}</strong>.`;
      } else {
        banner.className = "config-banner error";
        banner.innerHTML = "Mungojne <code>WPCOM_CLIENT_ID</code> ose <code>WPCOM_CLIENT_SECRET</code>. Vendosi ne environment variables dhe rinis serverin.";
      }
      submitButton.disabled = true;
      automationStartButton.disabled = true;
      return;
    }

    banner.className = "config-banner ready";
    banner.innerHTML = `Paneli eshte gati. Postimet do te dergohen ne <strong>${data.site}</strong>. ${data.aiReady ? "Gemini eshte gati." : "Mungon <code>GEMINI_API_KEY</code> per agentin automatik."} ${data.imageReady ? "Pexels eshte gati per foto." : "Mungon <code>PEXELS_API_KEY</code> nese do foto automatike."} ${data.facebookReady ? "Facebook Page autopost eshte gati." : "Mungon <code>FACEBOOK_PAGE_ID</code> ose <code>FACEBOOK_PAGE_ACCESS_TOKEN</code> per Facebook autopost."}`;
    submitButton.disabled = false;
    automationStartButton.disabled = !data.aiReady;
  } catch (error) {
    banner.className = "config-banner error";
    banner.textContent = "Nuk u lexua statusi i panelit. Sigurohu qe serveri lokal po punon.";
    submitButton.disabled = true;
    automationStartButton.disabled = true;
  }
}

async function loadAutomationStatus() {
  try {
    const response = await fetch("/api/automation-status");
    const data = await response.json();
    renderAutomationState(data);
  } catch (error) {
    automationState.className = "config-banner error";
    automationState.textContent = "Nuk u lexua statusi i agjentit automatik.";
  }
}

async function loadPresetList() {
  try {
    const response = await fetch("/api/automation/presets");
    const data = await response.json();
    const options = ['<option value="">Zgjidh preset-in</option>']
      .concat(
        (data.presets || []).map(
          (preset) => `<option value="${preset.name}">${preset.name} (${preset.stepCount} hapa)</option>`
        )
      )
      .join("");

    presetSelect.innerHTML = options;
  } catch {
    presetSelect.innerHTML = '<option value="">Preset-et nuk u lexuan</option>';
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const imageInput = document.getElementById("image");
  const imageFile = imageInput.files[0];
  let imagePayload = {};

  if (imageFile) {
    imagePayload = {
      imageBase64: await readFileAsDataUrl(imageFile),
      imageName: imageFile.name,
      imageType: imageFile.type,
    };
  }

  const normalizedSelection = normalizeCategorySelection(document.getElementById("category").value, subcategorySelect.value);
  const payload = {
    title: document.getElementById("title").value,
    category: normalizedSelection.category,
    subcategory: normalizedSelection.subcategory,
    excerpt: document.getElementById("excerpt").value,
    content: document.getElementById("content").value,
    status: document.getElementById("status").value,
    ...imagePayload,
  };

  submitButton.disabled = true;
  submitButton.textContent = "Po dergohet...";
  result.hidden = true;

  try {
    const response = await fetch("/api/create-post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Postimi nuk u krijua.");
    }

    const facebookMessage = data.facebook?.published
      ? " U postua edhe ne Facebook."
      : data.facebook?.enabled
        ? ` Facebook: ${data.facebook.error || data.facebook.reason || "nuk u publikua."}`
        : "";

    showResult(
      "success",
      `Postimi u dergua me sukses. <a href="${data.link}" target="_blank" rel="noreferrer">Hape ne WordPress</a>.${facebookMessage}`
    );
    form.reset();
    syncManualSubcategory();
  } catch (error) {
    showResult("error", error.message);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Dergo ne WordPress";
  }
});

automationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const steps = collectAutomationSteps();

  if (!steps.length) {
    automationState.className = "config-banner error";
    automationState.textContent = "Aktivizo te pakten nje hap ne planifikim.";
    return;
  }

  automationStartButton.disabled = true;
  automationStartButton.textContent = "Po niset...";

  try {
    const response = await fetch("/api/automation/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ steps }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Agjenti nuk u nis.");
    }

    renderAutomationState(data.automation);
  } catch (error) {
    automationState.className = "config-banner error";
    automationState.textContent = error.message;
  } finally {
    automationStartButton.disabled = false;
    automationStartButton.textContent = "Nis agjentin";
  }
});

automationStopButton.addEventListener("click", async () => {
  automationStopButton.disabled = true;

  try {
    const response = await fetch("/api/automation/stop", {
      method: "POST",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Agjenti nuk u ndal.");
    }

    renderAutomationState(data.automation);
  } catch (error) {
    automationState.className = "config-banner error";
    automationState.textContent = error.message;
  } finally {
    automationStopButton.disabled = false;
  }
});

savePresetButton.addEventListener("click", async () => {
  const name = presetNameInput.value.trim();
  const steps = collectAutomationSteps();

  if (!name) {
    automationState.className = "config-banner error";
    automationState.textContent = "Vendos nje emer per preset-in.";
    return;
  }

  if (!steps.length) {
    automationState.className = "config-banner error";
    automationState.textContent = "Preset-i duhet te kete te pakten nje hap aktiv.";
    return;
  }

  savePresetButton.disabled = true;

  try {
    const response = await fetch("/api/automation/preset/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, steps }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Preset-i nuk u ruajt.");
    }

    await loadPresetList();
    presetSelect.value = name;
    automationState.className = "config-banner ready";
    automationState.textContent = `Preset-i "${name}" u ruajt me sukses.`;
  } catch (error) {
    automationState.className = "config-banner error";
    automationState.textContent = error.message;
  } finally {
    savePresetButton.disabled = false;
  }
});

loadPresetButton.addEventListener("click", async () => {
  const name = presetSelect.value;
  if (!name) {
    automationState.className = "config-banner error";
    automationState.textContent = "Zgjidh nje preset per ta ngarkuar.";
    return;
  }

  loadPresetButton.disabled = true;

  try {
    const response = await fetch(`/api/automation/preset?name=${encodeURIComponent(name)}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Preset-i nuk u ngarkua.");
    }

    presetNameInput.value = data.preset.name || "";
    applyStepsToForm(data.preset.steps || []);
    automationState.className = "config-banner ready";
    automationState.textContent = `Preset-i "${data.preset.name}" u ngarkua.`;
  } catch (error) {
    automationState.className = "config-banner error";
    automationState.textContent = error.message;
  } finally {
    loadPresetButton.disabled = false;
  }
});

categorySelect.innerHTML = buildSelectOptions(CATEGORY_OPTIONS);
categorySelect.addEventListener("change", syncManualSubcategory);

renderAutomationRows();
applyStepsToForm([]);
syncManualSubcategory();
loadStatus();
loadAutomationStatus();
loadPresetList();
setInterval(loadAutomationStatus, 15000);
