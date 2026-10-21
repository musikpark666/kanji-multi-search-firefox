(function initializePopup() {
  "use strict";

  const { SITES, extractIdeographs, getDefaultSiteIds, normalizeSiteIds } = KANJI_LAUNCHER;
  const SETTINGS_KEY = "enabledSiteIds";
  const HISTORY_KEY = "recentCharacters";

  const form = document.querySelector("#search-form");
  const input = document.querySelector("#character-input");
  const openButton = document.querySelector("#open-button");
  const siteList = document.querySelector("#site-list");
  const selectionCount = document.querySelector("#selection-count");
  const status = document.querySelector("#status");
  const recentSection = document.querySelector("#recent-section");
  const recentList = document.querySelector("#recent-list");

  function getCheckedSiteIds() {
    return Array.from(siteList.querySelectorAll("input[type=checkbox]:checked"))
      .map((checkbox) => checkbox.value);
  }

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("error", isError);
  }

  function updateSelectionCount() {
    selectionCount.textContent = `${getCheckedSiteIds().length}サイト選択`;
  }

  async function saveSelection() {
    const enabledSiteIds = getCheckedSiteIds();
    await browser.storage.local.set({ [SETTINGS_KEY]: enabledSiteIds });
    updateSelectionCount();
  }

  function setCheckedSites(siteIds) {
    const enabled = new Set(siteIds);
    for (const checkbox of siteList.querySelectorAll("input[type=checkbox]")) {
      checkbox.checked = enabled.has(checkbox.value);
    }
    saveSelection();
  }

  function renderSites(enabledSiteIds) {
    const enabled = new Set(enabledSiteIds);
    const groups = new Map();

    for (const site of SITES) {
      if (!groups.has(site.group)) {
        groups.set(site.group, []);
      }
      groups.get(site.group).push(site);
    }

    for (const [groupName, sites] of groups) {
      const group = document.createElement("div");
      group.className = "site-group";

      const heading = document.createElement("p");
      heading.className = "group-name";
      heading.textContent = groupName;
      group.append(heading);

      for (const site of sites) {
        const label = document.createElement("label");
        label.className = "site-option";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = site.id;
        checkbox.checked = enabled.has(site.id);
        checkbox.addEventListener("change", saveSelection);

        const copy = document.createElement("span");
        const name = document.createElement("span");
        const description = document.createElement("span");
        name.className = "site-name";
        description.className = "site-description";
        name.textContent = site.name;
        description.textContent = site.description;
        copy.append(name, description);
        label.append(checkbox, copy);
        group.append(label);
      }

      siteList.append(group);
    }

    updateSelectionCount();
  }

  function renderRecent(characters) {
    recentList.replaceChildren();
    recentSection.hidden = !Array.isArray(characters) || characters.length === 0;

    for (const character of characters ?? []) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = character;
      button.title = `${character}を再検索`;
      button.addEventListener("click", () => {
        input.value = character;
        input.focus();
      });
      recentList.append(button);
    }
  }

  async function restoreState() {
    const stored = await browser.storage.local.get([SETTINGS_KEY, HISTORY_KEY]);
    const enabledSiteIds = normalizeSiteIds(stored[SETTINGS_KEY]);

    if (JSON.stringify(enabledSiteIds) !== JSON.stringify(stored[SETTINGS_KEY])) {
      await browser.storage.local.set({ [SETTINGS_KEY]: enabledSiteIds });
    }

    renderSites(enabledSiteIds);
    renderRecent(stored[HISTORY_KEY]);
    input.focus();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("");

    const ideographs = extractIdeographs(input.value);
    if (ideographs.length !== 1) {
      setStatus("漢字を一字だけ入力してください。", true);
      input.focus();
      input.select();
      return;
    }

    const siteIds = getCheckedSiteIds();
    if (siteIds.length === 0) {
      setStatus("サイトを一つ以上選択してください。", true);
      return;
    }

    openButton.disabled = true;
    setStatus("タブを開いています…");

    try {
      const result = await browser.runtime.sendMessage({
        type: "OPEN_CHARACTER",
        character: ideographs[0],
        siteIds
      });

      if (!result?.ok) {
        throw new Error(result?.error || "不明なエラーが発生しました。");
      }

      const suffix = result.grouped ? " · グループ作成" : "";
      setStatus(`${result.openedCount}個のタブを開きました${suffix}`);
    } catch (error) {
      setStatus(error.message, true);
      openButton.disabled = false;
    }
  });

  document.querySelector("#select-default").addEventListener("click", () => {
    setCheckedSites(getDefaultSiteIds());
  });

  document.querySelector("#select-all").addEventListener("click", () => {
    setCheckedSites(SITES.map((site) => site.id));
  });

  document.querySelector("#select-none").addEventListener("click", () => {
    setCheckedSites([]);
  });

  restoreState().catch((error) => setStatus(error.message, true));
})();
