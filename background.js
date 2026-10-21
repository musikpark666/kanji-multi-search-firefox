(function initializeBackground() {
  "use strict";

  const { extractIdeographs, normalizeSiteIds, resolveSites } = KANJI_LAUNCHER;
  const MENU_ID = "kanji-multi-search-selection";
  const SETTINGS_KEY = "enabledSiteIds";
  const HISTORY_KEY = "recentCharacters";

  async function getEnabledSiteIds() {
    const stored = await browser.storage.local.get(SETTINGS_KEY);
    return normalizeSiteIds(stored[SETTINGS_KEY]);
  }

  async function rememberCharacter(character) {
    const stored = await browser.storage.local.get(HISTORY_KEY);
    const history = Array.isArray(stored[HISTORY_KEY]) ? stored[HISTORY_KEY] : [];
    const next = [character, ...history.filter((item) => item !== character)].slice(0, 8);
    await browser.storage.local.set({ [HISTORY_KEY]: next });
  }

  async function openCharacter(character, requestedSiteIds) {
    const ideographs = extractIdeographs(character);
    if (ideographs.length !== 1) {
      throw new Error("漢字を一字だけ入力してください。");
    }

    const normalizedCharacter = ideographs[0];
    const selectedSites = resolveSites(requestedSiteIds);
    if (selectedSites.length === 0) {
      throw new Error("サイトを一つ以上選択してください。");
    }

    const [anchorTab] = await browser.tabs.query({ active: true, currentWindow: true });
    const createdTabs = [];
    const failedSites = [];

    for (let offset = 0; offset < selectedSites.length; offset += 1) {
      const site = selectedSites[offset];
      try {
        const createProperties = {
          url: site.buildUrl(normalizedCharacter),
          active: false
        };

        if (anchorTab?.windowId !== undefined) {
          createProperties.windowId = anchorTab.windowId;
        }
        if (anchorTab?.index !== undefined) {
          createProperties.index = anchorTab.index + 1 + offset;
        }
        if (anchorTab?.id !== undefined) {
          createProperties.openerTabId = anchorTab.id;
        }

        createdTabs.push(await browser.tabs.create(createProperties));
      } catch (error) {
        console.error(`Failed to open ${site.name}`, error);
        failedSites.push(site.name);
      }
    }

    if (createdTabs.length === 0) {
      throw new Error("検索タブを開けませんでした。");
    }

    let grouped = false;
    if (typeof browser.tabs.group === "function" && browser.tabGroups) {
      try {
        const groupId = await browser.tabs.group({
          tabIds: createdTabs.map((tab) => tab.id)
        });
        await browser.tabGroups.update(groupId, {
          title: `漢字 ${normalizedCharacter}`,
          color: "blue",
          collapsed: false
        });
        grouped = true;
      } catch (error) {
        console.warn("Tab grouping is unavailable; leaving tabs ungrouped.", error);
      }
    }

    await rememberCharacter(normalizedCharacter);
    await browser.tabs.update(createdTabs[0].id, { active: true });

    return {
      character: normalizedCharacter,
      openedCount: createdTabs.length,
      grouped,
      failedSites
    };
  }

  browser.runtime.onInstalled.addListener(() => {
    browser.menus.removeAll().then(() => {
      browser.menus.create({
        id: MENU_ID,
        title: "選択した漢字「%s」を一括検索",
        contexts: ["selection"]
      });
    });
  });

  browser.menus.onClicked.addListener(async (info) => {
    if (info.menuItemId !== MENU_ID || !info.selectionText) {
      return;
    }

    const ideographs = extractIdeographs(info.selectionText);
    if (ideographs.length === 0) {
      return;
    }

    try {
      await openCharacter(ideographs[0], await getEnabledSiteIds());
    } catch (error) {
      console.error("Context-menu search failed", error);
    }
  });

  browser.runtime.onMessage.addListener((message) => {
    if (message?.type !== "OPEN_CHARACTER") {
      return undefined;
    }

    return openCharacter(message.character, message.siteIds)
      .then((result) => ({ ok: true, ...result }))
      .catch((error) => ({ ok: false, error: error.message }));
  });
})();
