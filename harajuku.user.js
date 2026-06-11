// ==UserScript==
// @name         niconico Harajuku-ish helpers
// @namespace    github.com/roflsunriz/harajuku
// @version      0.1.0
// @description  Adds dynamic Harajuku-ish watch-page metadata and a light/dark theme button.
// @author       roflsunriz
// @match        https://www.nicovideo.jp/watch/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  const THEME_KEY = "harajuku-theme";
  const ROOT = document.documentElement;

  const SELECTORS = {
    sidebarPanel: 'div[class*="grid-area_"][class*="sidebar"] > div > div:first-child',
    bottom: 'section[class*="grid-template-areas"] > div[class*="grid-area_"][class*="bottom"]',
    detailList: 'section[class*="grid-template-areas"] > div[class*="grid-area_"][class*="bottom"] > section:first-of-type dl',
    header: "#root > div > header",
  };

  const META_ITEMS = [
    { key: "views", label: "再生", source: "再生" },
    { key: "comments", label: "コメント", source: "コメント" },
    { key: "mylists", label: "マイリスト", source: "マイリスト" },
    { key: "postedAt", label: "投稿日時", source: "投稿日時" },
  ];

  function textOf(element) {
    return (element?.innerText || element?.textContent || "").replace(/\s+/g, " ").trim();
  }

  function getTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "dark" ? "dark" : "light";
  }

  function setTheme(theme) {
    const nextTheme = theme === "dark" ? "dark" : "light";
    localStorage.setItem(THEME_KEY, nextTheme);
    ROOT.dataset.hyTheme = nextTheme;
    ROOT.style.colorScheme = nextTheme;
    const button = document.querySelector(".HarajukuThemeButton");
    if (button) {
      button.setAttribute("aria-label", `${nextTheme === "dark" ? "Light" : "Dark"} theme`);
      button.setAttribute("aria-pressed", nextTheme === "dark" ? "true" : "false");
      button.dataset.hyThemeButton = nextTheme;
    }
    installThemeOverride();
  }

  function installThemeOverride() {
    let style = document.getElementById("harajuku-theme-override");
    if (!style) {
      style = document.createElement("style");
      style.id = "harajuku-theme-override";
      (document.head || document.documentElement).appendChild(style);
    }

    style.textContent = `
      :root[data-hy-theme="light"] {
        --hy-bg: #fff !important;
        --hy-page: #fff !important;
        --hy-panel: #fff !important;
        --hy-panel-2: #f2f2f2 !important;
        --hy-border: #b7b7b7 !important;
        --hy-text: #222 !important;
        --hy-link: #0645ad !important;
        --hy-player: #111 !important;
      }

      :root[data-hy-theme="dark"] {
        --hy-bg: #151515 !important;
        --hy-page: #1b1b1b !important;
        --hy-panel: #202020 !important;
        --hy-panel-2: #2a2a2a !important;
        --hy-border: #555 !important;
        --hy-text: #e8e8e8 !important;
        --hy-link: #8dbbff !important;
        --hy-player: #050505 !important;
      }

      html[data-hy-theme="light"],
      :root[data-hy-theme="light"] body,
      :root[data-hy-theme="light"] #root main,
      :root[data-hy-theme="light"] body::before {
        background: #fff !important;
        color: #222 !important;
      }

      html[data-hy-theme="dark"],
      :root[data-hy-theme="dark"] body,
      :root[data-hy-theme="dark"] #root main,
      :root[data-hy-theme="dark"] body::before {
        background: #151515 !important;
        color: #e8e8e8 !important;
      }

      :root[data-hy-theme="light"] #root > div > header,
      :root[data-hy-theme="light"] section[class*="grid-template-areas"] > div[class*="grid-area_"][class*="bottom"] > div:first-child h1,
      :root[data-hy-theme="light"] section[class*="grid-template-areas"] section,
      :root[data-hy-theme="light"] section[class*="grid-template-areas"] aside,
      :root[data-hy-theme="light"] section[class*="grid-template-areas"] [class*="surfaceHighEm"],
      :root[data-hy-theme="light"] div[class*="grid-area_"][class*="sidebar"] > div > div:first-child {
        background: #fff !important;
        border-color: #b7b7b7 !important;
        color: #222 !important;
      }

      :root[data-hy-theme="light"] #root > div > header a[title="ニコニコ動画"]::after {
        color: #111 !important;
        text-shadow: 0 1px 0 #fff !important;
      }

      :root[data-hy-theme="light"] #root > div > header form[role="search"],
      :root[data-hy-theme="light"] #root > div > header input[role="combobox"],
      :root[data-hy-theme="light"] input,
      :root[data-hy-theme="light"] textarea,
      :root[data-hy-theme="light"] select {
        background: #fff !important;
        border-color: #999 !important;
        color: #111 !important;
      }

      :root[data-hy-theme="light"] #root > div > header form[role="search"]::before {
        background: linear-gradient(#fff, #e2e2e2) !important;
        border-right-color: #999 !important;
        color: #111 !important;
        text-shadow: 0 1px 0 #fff !important;
      }

      :root[data-hy-theme="light"] section[class*="grid-template-areas"]::after,
      :root[data-hy-theme="light"] section[class*="grid-template-areas"] > div[class*="grid-area_"][class*="bottom"] > div:nth-child(2),
      :root[data-hy-theme="light"] a[data-anchor-area="tags"],
      :root[data-hy-theme="light"] a[href^="/tag/"],
      :root[data-hy-theme="light"] #TagItemsCounter,
      :root[data-hy-theme="light"] #TagItemsShareButton,
      :root[data-hy-theme="light"] .PlayerPresenter textarea[placeholder="コメントを入力"],
      :root[data-hy-theme="light"] .PlayerPresenter input[placeholder="コマンド"],
      :root[data-hy-theme="light"] div[class*="grid-area_"][class*="sidebar"] section > div {
        background: #fff !important;
        border-color: #999 !important;
        color: #111 !important;
        text-shadow: none !important;
      }

      :root[data-hy-theme="light"] a[data-anchor-area="tags"],
      :root[data-hy-theme="light"] a[href^="/tag/"],
      :root[data-hy-theme="light"] #TagItemsCounter,
      :root[data-hy-theme="light"] #TagItemsShareButton {
        background: linear-gradient(#fff, #e7e7e7) !important;
        color: #0645ad !important;
      }

      :root[data-hy-theme="light"] section[class*="grid-template-areas"] section > header,
      :root[data-hy-theme="light"] div[class*="grid-area_"][class*="sidebar"] section > header {
        background: linear-gradient(#fdfdfd, #e1e1e1) !important;
        border-color: #b7b7b7 !important;
        color: #111 !important;
        text-shadow: 0 1px 0 #fff !important;
      }

      :root[data-hy-theme="light"] div[class*="grid-area_"][class*="sidebar"] section > header *,
      :root[data-hy-theme="light"] section[class*="grid-template-areas"] section > header * {
        color: #111 !important;
        fill: #111 !important;
      }

      :root[data-hy-theme="light"] div[class*="grid-area_"][class*="sidebar"] section [class*="Pressable"]:nth-child(even),
      :root[data-hy-theme="light"] div[class*="grid-area_"][class*="sidebar"] section li:nth-child(even) {
        background: #eee !important;
        color: #111 !important;
      }

      :root[data-hy-theme="light"] div[class*="grid-area_"][class*="sidebar"] section [class*="Pressable"]:hover,
      :root[data-hy-theme="light"] div[class*="grid-area_"][class*="sidebar"] section li:hover {
        background: #dcdcdc !important;
      }

      :root[data-hy-theme="light"] #root main button:not([aria-label="コメント投稿ボタン"]):not([aria-label*="ニコる"]):not([data-element-name*="nicoru"]),
      :root[data-hy-theme="light"] #root main [role="button"]:not([aria-label="コメント投稿ボタン"]):not([aria-label*="ニコる"]):not([data-element-name*="nicoru"]),
      :root[data-hy-theme="light"] #root > div > header button,
      :root[data-hy-theme="light"] #root > div > header [role="button"],
      :root[data-hy-theme="light"] #root > div > header .Pressable {
        background: linear-gradient(#fff, #e1e1e1) !important;
        border-color: #aaa !important;
        color: #111 !important;
        fill: #111 !important;
        text-shadow: 0 1px 0 #fff !important;
      }

      :root[data-hy-theme="light"] #root main button:not([aria-label="コメント投稿ボタン"]):not([aria-label*="ニコる"]):not([data-element-name*="nicoru"]) *,
      :root[data-hy-theme="light"] #root main [role="button"]:not([aria-label="コメント投稿ボタン"]):not([aria-label*="ニコる"]):not([data-element-name*="nicoru"]) *,
      :root[data-hy-theme="light"] #root > div > header button *,
      :root[data-hy-theme="light"] #root > div > header [role="button"] *,
      :root[data-hy-theme="light"] #root > div > header .Pressable * {
        color: #111 !important;
        fill: #111 !important;
      }

      :root[data-hy-theme="light"] #root > div > header a:not([title="ニコニコ動画"]),
      :root[data-hy-theme="light"] #root > div > header [class*="bg_layer"],
      :root[data-hy-theme="light"] #root > div > header [class*="bg-c_layer"] {
        background: #fff !important;
        color: #111 !important;
      }

      :root[data-hy-theme="dark"] #CommonHeader,
      :root[data-hy-theme="dark"] section[class*="grid-template-areas"] section,
      :root[data-hy-theme="dark"] section[class*="grid-template-areas"] aside,
      :root[data-hy-theme="dark"] section[class*="grid-template-areas"] [class*="surfaceHighEm"],
      :root[data-hy-theme="dark"] div[class*="grid-area_"][class*="sidebar"] > div > div:first-child {
        background: #202020 !important;
        border-color: #555 !important;
        color: #e8e8e8 !important;
      }

      :root[data-hy-theme="dark"] #root > div > header {
        background: #151515 !important;
        color: #e8e8e8 !important;
      }

      :root[data-hy-theme="dark"] section[class*="grid-template-areas"] > div[class*="grid-area_"][class*="bottom"] > div:first-child h1 {
        background: linear-gradient(#2e2e2e, #202020) !important;
        border-color: #666 !important;
        color: #f2f2f2 !important;
      }

      :root[data-hy-theme="dark"] #CommonHeader a[href^="https://www.nicovideo.jp?"] {
        filter: brightness(0) invert(.68) contrast(.95) !important;
        opacity: .72 !important;
      }

      :root[data-hy-theme="dark"] #root > div > header a[title="ニコニコ動画"]::after {
        color: #a8a8a8 !important;
        text-shadow: 0 -1px 0 #000 !important;
      }

      :root[data-hy-theme="dark"] #root > div > header form[role="search"] {
        background: #141414 !important;
        border-color: #2d2d2d !important;
        box-shadow: inset 0 1px 1px rgba(0, 0, 0, .85) !important;
      }

      :root[data-hy-theme="dark"] #root > div > header form[role="search"]::before {
        background: #191919 !important;
        border-right-color: #2d2d2d !important;
        color: #aaa !important;
        text-shadow: 0 -1px 0 #000 !important;
      }

      :root[data-hy-theme="dark"] #root > div > header input[role="combobox"] {
        background: #141414 !important;
        color: #c8c8c8 !important;
      }

      :root[data-hy-theme="dark"] #root > div > header form[role="search"] button[aria-label="検索"] {
        background: #191919 !important;
        border-left-color: #2d2d2d !important;
        color: #aaa !important;
      }
    `;
  }

  function toggleTheme() {
    setTheme(getTheme() === "dark" ? "light" : "dark");
  }

  function createThemeButton() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "HarajukuThemeButton";
    button.innerHTML = '<span class="HarajukuThemeButton-sun" aria-hidden="true">☀</span><span class="HarajukuThemeButton-knob" aria-hidden="true"></span><span class="HarajukuThemeButton-moon" aria-hidden="true">☾</span>';
    button.addEventListener("click", toggleTheme);
    return button;
  }

  function readDetailMeta() {
    const result = {};
    const dl = document.querySelector(SELECTORS.detailList);
    if (!dl) return result;

    for (const item of dl.children) {
      const dt = item.querySelector("dt");
      const dd = item.querySelector("dd");
      const label = textOf(dt);
      const value = textOf(dd);
      if (label && value) result[label] = value;
    }

    return result;
  }

  function formatNumber(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
    return value.toLocaleString("ja-JP");
  }

  function formatDateTime(value) {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  function readStructuredMeta() {
    const video = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map((script) => {
        try {
          return JSON.parse(script.textContent);
        } catch {
          return undefined;
        }
      })
      .find((data) => data?.["@type"] === "VideoObject");

    const stats = Array.isArray(video?.interactionStatistic) ? video.interactionStatistic : [];
    const interactionCount = (type) => {
      const item = stats.find((stat) => String(stat?.interactionType || "").includes(type));
      return typeof item?.userInteractionCount === "number" ? item.userInteractionCount : undefined;
    };

    return {
      "投稿日時": formatDateTime(video?.uploadDate),
      "再生": formatNumber(interactionCount("WatchAction")),
      "コメント": formatNumber(video?.commentCount),
      "マイリスト": formatNumber(interactionCount("WantAction")),
    };
  }

  function readFallbackMeta() {
    const result = {};
    const infoRoot = document.querySelector(`${SELECTORS.bottom} > div:first-child > :first-child`);
    const metaLine = infoRoot?.querySelector("div:has(> time[datetime])");
    const children = metaLine ? Array.from(metaLine.children) : [];
    const time = children.find((child) => child.matches("time[datetime]"));
    const counters = children.filter((child) => child.matches("div"));

    if (time) result["投稿日時"] = textOf(time);
    if (counters[0]) result["再生"] = textOf(counters[0]);
    if (counters[1]) result["コメント"] = textOf(counters[1]);

    return result;
  }

  function currentMeta() {
    const result = {};
    for (const source of [readFallbackMeta(), readDetailMeta(), readStructuredMeta()]) {
      for (const [key, value] of Object.entries(source)) {
        if (value) result[key] = value;
      }
    }
    return result;
  }

  function makeStatItem(label, key) {
    const node = document.createElement("div");
    node.className = key === "postedAt" ? "HarajukuStats-date" : "HarajukuStats-row";
    node.dataset.hyKey = key;

    const labelNode = document.createElement("span");
    labelNode.className = "HarajukuStats-label";
    labelNode.textContent = label;

    const valueNode = document.createElement("span");
    valueNode.className = "HarajukuStats-value";
    valueNode.textContent = "-";

    node.append(labelNode, valueNode);
    return node;
  }

  function createChrome() {
    const chrome = document.createElement("div");
    chrome.className = "HarajukuWatchChrome";

    const stats = document.createElement("div");
    stats.className = "HarajukuStats";
    for (const item of META_ITEMS) {
      stats.append(makeStatItem(item.label, item.key));
    }

    chrome.append(stats, createThemeButton());
    return chrome;
  }

  function ensureChrome() {
    const sidebar = document.querySelector(SELECTORS.sidebarPanel);
    if (!sidebar) return undefined;

    let chrome = sidebar.querySelector(":scope > .HarajukuWatchChrome");
    if (!chrome) {
      chrome = createChrome();
      sidebar.prepend(chrome);
      setTheme(getTheme());
    }

    return chrome;
  }

  function renderChrome() {
    const chrome = ensureChrome();
    if (!chrome) return false;

    const values = currentMeta();
    const signature = META_ITEMS.map((item) => values[item.source] || "-").join("\n");
    if (chrome.dataset.hySignature === signature) return true;
    chrome.dataset.hySignature = signature;

    for (const item of META_ITEMS) {
      const value = chrome.querySelector(`.HarajukuStats [data-hy-key="${item.key}"] .HarajukuStats-value`);
      if (value) value.textContent = values[item.source] || "-";
    }

    return true;
  }

  let scheduled = false;
  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      renderChrome();
    });
  }

  function start() {
    setTheme(getTheme());
    scheduleRender();

    let retryCount = 0;
    const retryTimer = window.setInterval(() => {
      retryCount += 1;
      scheduleRender();
      const meta = currentMeta();
      if (retryCount >= 40 || (meta["再生"] && meta["コメント"] && meta["マイリスト"] && meta["投稿日時"])) {
        window.clearInterval(retryTimer);
      }
    }, 500);

    const observer = new MutationObserver(scheduleRender);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start, { once: true });
})();
