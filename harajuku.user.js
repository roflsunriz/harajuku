// ==UserScript==
// @name         niconico Harajuku-ish helpers
// @namespace    github.com/roflsunriz/harajuku
// @version      0.1.2
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
    grid: 'section[class*="grid-template-areas"]',
    bottom: 'section[class*="grid-template-areas"] > div[class*="grid-area_"][class*="bottom"]',
    detailList: 'section[class*="grid-template-areas"] > div[class*="grid-area_"][class*="bottom"] > section:first-of-type dl',
    detailContent: 'section[class*="grid-template-areas"] > div[class*="grid-area_"][class*="bottom"] > section:first-of-type > :not(header)',
    title: 'section[class*="grid-template-areas"] > div[class*="grid-area_"][class*="bottom"] > div:first-child h1',
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
    document.getElementById("harajuku-theme-override")?.remove();
    ROOT.dataset.hyTheme = nextTheme;
    ROOT.style.colorScheme = nextTheme;
    const button = document.querySelector(".HarajukuThemeButton");
    if (button) {
      button.setAttribute("aria-label", `${nextTheme === "dark" ? "Light" : "Dark"} theme`);
      button.setAttribute("aria-pressed", nextTheme === "dark" ? "true" : "false");
      button.dataset.hyThemeButton = nextTheme;
    }
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

  function findCommentListSection(root = document) {
    if (!root) return null;

    return (
      Array.from(root.querySelectorAll("section")).find((section) => {
        const header = section.querySelector(":scope > header");
        return header?.textContent?.includes("コメントリスト") ?? false;
      }) ?? null
    );
  }

  function findSidebarPanel() {
    const commentListSection = findCommentListSection();
    return commentListSection?.parentElement ?? document.querySelector(SELECTORS.sidebarPanel);
  }

  function ensureChrome() {
    const sidebar = findSidebarPanel();
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
    updateLayoutMetrics();

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

  function px(value) {
    return `${Math.max(0, Math.round(value))}px`;
  }

  let resizeObserver;
  function observeLayoutTargets(targets) {
    if (!("ResizeObserver" in window)) return;
    if (!resizeObserver) resizeObserver = new ResizeObserver(scheduleRender);

    for (const target of targets) {
      if (target) resizeObserver.observe(target);
    }
  }

  function updateLayoutMetrics() {
    const grid = document.querySelector(SELECTORS.grid);
    const title = document.querySelector(SELECTORS.title);
    const sidebar = findSidebarPanel();
    const sidebarColumn = sidebar?.parentElement;
    const commentListSection = findCommentListSection(sidebarColumn);
    const detailContent = document.querySelector(SELECTORS.detailContent);

    if (detailContent?.getAttribute("aria-hidden") === "false") {
      const previousHeight = detailContent.style.height;
      const previousMinHeight = detailContent.style.minHeight;
      const previousMaxHeight = detailContent.style.maxHeight;
      const previousHeightPriority = detailContent.style.getPropertyPriority("height");
      const previousMinHeightPriority = detailContent.style.getPropertyPriority("min-height");
      const previousMaxHeightPriority = detailContent.style.getPropertyPriority("max-height");
      detailContent.style.setProperty("height", "auto", "important");
      detailContent.style.setProperty("min-height", "0", "important");
      detailContent.style.setProperty("max-height", "none", "important");

      const detailRect = detailContent.getBoundingClientRect();
      const borderHeight = detailRect.height - detailContent.clientHeight;
      const nextDetailHeight = Math.max(
        detailContent.scrollHeight + Math.max(0, borderHeight),
        detailRect.height,
      );

      detailContent.style.setProperty("height", previousHeight, previousHeightPriority);
      detailContent.style.setProperty("min-height", previousMinHeight, previousMinHeightPriority);
      detailContent.style.setProperty("max-height", previousMaxHeight, previousMaxHeightPriority);

      ROOT.style.setProperty("--hy-detail-expanded-height", px(nextDetailHeight));
    }

    if (title && sidebar) {
      const titleTop = title.getBoundingClientRect().top;
      const panelBottom =
        commentListSection?.getBoundingClientRect().bottom ??
        sidebarColumn?.getBoundingClientRect().bottom ??
        sidebar.getBoundingClientRect().bottom;
      ROOT.style.setProperty("--hy-watch-sidebar-panel-height", px(panelBottom - titleTop));
    }

    const sidebarExtraPanels = Array.from(
      sidebarColumn?.querySelectorAll(':scope > section, :scope > [data-scope="tabs"][data-part="root"]') ?? [],
    );

    observeLayoutTargets([grid, title, sidebar, sidebarColumn, detailContent, commentListSection, ...sidebarExtraPanels]);
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
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    });

    window.addEventListener("resize", scheduleRender);
  }

  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start, { once: true });
})();
