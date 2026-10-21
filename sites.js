(function initializeKanjiSites(global) {
  "use strict";

  const SITES = Object.freeze([
    {
      id: "naver-kanji",
      name: "NAVER漢字辞典",
      group: "基礎学習",
      description: "韓国式の音訓と漢字語",
      defaultEnabled: true,
      buildUrl: (char) =>
        `https://hanja.dict.naver.com/#/search?query=${encodeURIComponent(char)}`
    },
    {
      id: "naver-ja",
      name: "NAVER日本語辞典",
      group: "基礎学習",
      description: "日本語の音読み・訓読みと語彙",
      defaultEnabled: true,
      buildUrl: (char) =>
        `https://ja.dict.naver.com/#/search?query=${encodeURIComponent(char)}`
    },
    {
      id: "jitenon",
      name: "漢字辞典オンライン",
      group: "日本語",
      description: "音訓・学年・漢検・筆順・熟語",
      defaultEnabled: true,
      buildUrl: (char) =>
        browser.runtime.getURL(`jitenon-search.html?char=${encodeURIComponent(char)}`)
    },
    {
      id: "kanjipedia",
      name: "漢字ペディア",
      group: "日本語",
      description: "日本漢字能力検定協会の辞典",
      defaultEnabled: false,
      buildUrl: (char) =>
        `https://www.kanjipedia.jp/search?k=${encodeURIComponent(char)}&kt=1&sk=leftHand`
    },
    {
      id: "kotobank",
      name: "コトバンク",
      group: "日本語",
      description: "大辞典・『字通』などの横断検索",
      defaultEnabled: false,
      buildUrl: (char) => `https://kotobank.jp/word/${encodeURIComponent(char)}`
    },
    {
      id: "jisho",
      name: "Jisho.org",
      group: "日本語",
      description: "日英辞典・語彙・JLPT情報",
      defaultEnabled: false,
      buildUrl: (char) =>
        `https://jisho.org/search/${encodeURIComponent(char)}%20%23kanji`
    },
    {
      id: "weblio",
      name: "Weblio辞書",
      group: "日本語",
      description: "複数の日本語辞典を横断検索",
      defaultEnabled: false,
      buildUrl: (char) => `https://www.weblio.jp/content/${encodeURIComponent(char)}`
    },
    {
      id: "kanjivg",
      name: "KanjiVG",
      group: "筆順・書体",
      description: "筆画・部首・構成のアニメーション",
      defaultEnabled: false,
      buildUrl: (char) =>
        `https://kanjivg.tagaini.net/viewer.html?kanji=${encodeURIComponent(char)}`
    },
    {
      id: "zi-tools",
      name: "zi.tools",
      group: "字形・字源",
      description: "字形変化とCJK統合情報",
      defaultEnabled: true,
      buildUrl: (char) => `https://zi.tools/zi/${encodeURIComponent(char)}`
    },
    {
      id: "namuwiki",
      name: "ナムウィキ",
      group: "基礎学習",
      description: "韓国語圏の総合解説",
      defaultEnabled: true,
      buildUrl: (char) => `https://namu.wiki/w/${encodeURIComponent(char)}`
    },
    {
      id: "wiktionary-en",
      name: "英語版ウィクショナリー",
      group: "字形・字源",
      description: "「Glyph origin」節",
      defaultEnabled: true,
      buildUrl: (char) =>
        `https://en.wiktionary.org/wiki/${encodeURIComponent(char)}#Glyph_origin`
    },
    {
      id: "wiktionary-ja",
      name: "日本語版ウィクショナリー",
      group: "字形・字源",
      description: "「字源」節",
      defaultEnabled: true,
      buildUrl: (char) =>
        `https://ja.wiktionary.org/wiki/${encodeURIComponent(char)}#${encodeURIComponent("字源")}`
    },
    {
      id: "hanziyuan",
      name: "Hanziyuan",
      group: "字形・字源",
      description: "甲骨文・金文・篆書の字形集",
      defaultEnabled: false,
      buildUrl: (char) => `https://hanziyuan.net/#${encodeURIComponent(char)}`
    },
    {
      id: "unihan",
      name: "Unicode UniHan",
      group: "専門資料",
      description: "UnicodeのCJK属性・読み・典拠",
      defaultEnabled: false,
      buildUrl: (char) => {
        const codePoint = Array.from(char)[0].codePointAt(0).toString(16).toUpperCase();
        return `https://www.unicode.org/cgi-bin/GetUnihanData.pl?codepoint=${codePoint}`;
      }
    },
    {
      id: "cuhk",
      name: "香港中文大学漢字データベース",
      group: "専門資料",
      description: "古文字・字義・方言資料",
      defaultEnabled: false,
      buildUrl: (char) =>
        `https://humanum.arts.cuhk.edu.hk/Lexis/lexi-mf/search.php?word=${encodeURIComponent(char)}`
    },
    {
      id: "zdic",
      name: "漢典",
      group: "中国語・古典",
      description: "中国語の字典・辞書資料",
      defaultEnabled: false,
      buildUrl: (char) => `https://www.zdic.net/hans/${encodeURIComponent(char)}`
    },
    {
      id: "ctext",
      name: "Chinese Text Project",
      group: "中国語・古典",
      description: "古典用例と統合辞書",
      defaultEnabled: false,
      buildUrl: (char) =>
        `https://ctext.org/dictionary.pl?if=en&char=${encodeURIComponent(char)}`
    },
    {
      id: "glyphwiki",
      name: "GlyphWiki",
      group: "専門資料",
      description: "稀少字と詳細な字形",
      defaultEnabled: false,
      buildUrl: (char) => {
        const codePoint = Array.from(char)[0].codePointAt(0).toString(16);
        return `https://glyphwiki.org/wiki/u${codePoint}`;
      }
    }
  ]);

  const VARIATION_SELECTOR = /[\uFE00-\uFE0F\u{E0100}-\u{E01EF}]/u;
  const IDEOGRAPH = /\p{Unified_Ideograph}/u;
  const LEGACY_DEFAULT_SITE_IDS = Object.freeze([
    "naver-kanji",
    "naver-ja",
    "zi-tools",
    "namuwiki",
    "wiktionary-en",
    "wiktionary-ja"
  ]);

  function extractIdeographs(value) {
    const text = String(value ?? "").normalize("NFC");
    const characters = [];

    for (const symbol of Array.from(text)) {
      if (IDEOGRAPH.test(symbol)) {
        characters.push(symbol);
      } else if (VARIATION_SELECTOR.test(symbol) && characters.length > 0) {
        characters[characters.length - 1] += symbol;
      }
    }

    return characters;
  }

  function getDefaultSiteIds() {
    return SITES.filter((site) => site.defaultEnabled).map((site) => site.id);
  }

  function normalizeSiteIds(siteIds) {
    if (!Array.isArray(siteIds)) {
      return getDefaultSiteIds();
    }

    const knownIds = new Set(SITES.map((site) => site.id));
    const selected = new Set(siteIds.filter((id) => knownIds.has(id)));
    const matchesLegacyDefaults =
      selected.size === LEGACY_DEFAULT_SITE_IDS.length &&
      LEGACY_DEFAULT_SITE_IDS.every((id) => selected.has(id));

    if (matchesLegacyDefaults) {
      selected.add("jitenon");
    }

    return SITES.filter((site) => selected.has(site.id)).map((site) => site.id);
  }

  function resolveSites(siteIds) {
    const selected = new Set(normalizeSiteIds(siteIds));
    return SITES.filter((site) => selected.has(site.id));
  }

  const api = Object.freeze({
    SITES,
    extractIdeographs,
    getDefaultSiteIds,
    normalizeSiteIds,
    resolveSites
  });
  global.KANJI_LAUNCHER = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(globalThis);
