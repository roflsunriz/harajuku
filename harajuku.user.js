// ==UserScript==
// @name         niconico Harajuku-ish helpers
// @namespace    github.com/roflsunriz/harajuku
// @version      0.2.0
// @description  Adds dynamic Harajuku-ish watch-page metadata, owner controls, and a light/dark theme button.
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

  let ownerApiMetadata;
  let ownerMetadataUrl = "";
  let ownerMetadataPromise;

  function parseServerResponseMeta(content) {
    try {
      return JSON.parse(content);
    } catch {
      return JSON.parse(decodeURIComponent(content));
    }
  }

  function buildOwnerApiMetadata(apiData) {
    const owner = apiData?.owner;
    if (owner?.id != null && owner.nickname && owner.iconUrl) {
      const profileHref = `/user/${owner.id}`;
      return {
        name: owner.nickname,
        profileHref,
        videoHref: `${profileHref}/video`,
        iconSrc: owner.iconUrl,
      };
    }

    const channel = apiData?.channel;
    if (channel?.id != null && channel.name && channel.iconUrl) {
      const profileHref = channel.url || `/channel/${channel.id}`;
      return {
        name: channel.name,
        profileHref,
        videoHref: `${profileHref.replace(/\/$/, "")}/video`,
        iconSrc: channel.iconUrl,
      };
    }
    return undefined;
  }

  async function refreshOwnerApiMetadata() {
    const requestedUrl = location.href;
    if (ownerMetadataPromise && ownerMetadataUrl === requestedUrl) return ownerMetadataPromise;
    ownerMetadataUrl = requestedUrl;
    ownerApiMetadata = undefined;
    ownerMetadataPromise = (async () => {
      try {
        const response = await fetch(requestedUrl, { credentials: "include" });
        if (!response.ok) throw new Error(`watch page fetch failed: ${response.status}`);
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const content = doc.querySelector('meta[name="server-response"]')?.getAttribute("content");
        if (!content) throw new Error("server-response meta was not found");
        const apiData = parseServerResponseMeta(content)?.data?.response;
        if (location.href !== requestedUrl) return;
        ownerApiMetadata = buildOwnerApiMetadata(apiData);
      } catch (error) {
        console.warn("[Harajuku] 投稿者情報の取得に失敗しました", error);
      } finally {
        ownerMetadataPromise = undefined;
        scheduleRender();
      }
    })();
    return ownerMetadataPromise;
  }

  function readOwnerApiMetadata() {
    if (ownerMetadataUrl !== location.href && !ownerMetadataPromise) void refreshOwnerApiMetadata();
    return ownerApiMetadata;
  }

  function cloneActionIcon(source, fallback) {
    const icon = source?.querySelector("svg")?.cloneNode(true);
    if (icon instanceof Element) {
      icon.removeAttribute("class");
      icon.setAttribute("aria-hidden", "true");
      return icon;
    }
    const span = document.createElement("span");
    span.setAttribute("aria-hidden", "true");
    span.textContent = fallback;
    return span;
  }

  function createOwnerActionButton(className, label, source, fallback) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.setAttribute("aria-label", label);
    button.disabled = !source;
    button.append(cloneActionIcon(source, fallback));
    button.addEventListener("click", () => source?.click());
    return button;
  }

  function waitForElement(selector, timeoutMs = 1500) {
    const existing = document.querySelector(selector);
    if (existing) return Promise.resolve(existing);
    return new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (!element) return;
        observer.disconnect();
        clearTimeout(timer);
        resolve(element);
      });
      const timer = setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeoutMs);
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  async function openOfficialOwnerMuteDialog() {
    const detailContent = document.querySelector(SELECTORS.detailContent);
    const wasCollapsed = detailContent?.getAttribute("aria-hidden") !== "false";
    const detailToggle = document.querySelector(`${SELECTORS.bottom} > section:first-of-type > header > :first-child`);
    if (wasCollapsed) detailToggle?.click();
    const menuTrigger = await waitForElement(`${SELECTORS.detailContent} button[data-scope="menu"][data-part="trigger"]`);
    if (!menuTrigger) return;
    menuTrigger.click();
    const muteAction = await waitForElement('[data-scope="menu"][data-part="item"][data-value="mute"] button');
    muteAction?.click();
    if (wasCollapsed && muteAction) setTimeout(() => detailToggle?.click(), 100);
  }

  function createOwnerMenu(source) {
    const wrapper = document.createElement("div");
    wrapper.className = "HarajukuOwner-menuWrapper";
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "HarajukuOwner-action HarajukuOwner-menu";
    trigger.setAttribute("aria-label", "その他の操作");
    trigger.setAttribute("aria-haspopup", "menu");
    trigger.setAttribute("aria-expanded", "false");
    trigger.append(cloneActionIcon(source, "…"));
    const menu = document.createElement("div");
    menu.className = "HarajukuOwner-menuPopup";
    menu.setAttribute("role", "menu");
    menu.hidden = true;
    const mute = document.createElement("button");
    mute.type = "button";
    mute.className = "HarajukuOwner-menuItem";
    mute.setAttribute("role", "menuitem");
    mute.textContent = "このユーザーの動画を非表示";
    mute.addEventListener("click", () => {
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      void openOfficialOwnerMuteDialog();
    });
    trigger.addEventListener("click", () => {
      const open = menu.hidden;
      menu.hidden = !open;
      trigger.setAttribute("aria-expanded", String(open));
    });
    menu.append(mute);
    wrapper.append(trigger, menu);
    return wrapper;
  }

  function createOwnerPanel(owner) {
    const panel = document.createElement("div");
    panel.className = "HarajukuOwner";
    const iconLink = document.createElement("a");
    iconLink.className = "HarajukuOwner-iconLink";
    iconLink.href = owner.profileHref;
    iconLink.setAttribute("aria-label", owner.name);
    const icon = document.createElement("img");
    icon.className = "HarajukuOwner-icon";
    icon.src = owner.iconSrc;
    icon.alt = owner.name;
    icon.loading = "lazy";
    iconLink.append(icon);
    const body = document.createElement("div");
    body.className = "HarajukuOwner-body";
    const name = document.createElement("a");
    name.className = "HarajukuOwner-name";
    name.href = owner.profileHref;
    name.textContent = owner.name;
    const videos = document.createElement("a");
    videos.className = "HarajukuOwner-videos";
    videos.href = owner.videoHref;
    videos.textContent = "投稿動画";
    body.append(name, videos);
    const follow = document.querySelector('[data-element-name="follow_user"]');
    const supportSource = document.querySelector('a[data-element-name="creator_support"]');
    const menuSource = document.querySelector(`${SELECTORS.detailContent} button[data-scope="menu"][data-part="trigger"]`);
    const actions = document.createElement("div");
    actions.className = "HarajukuOwner-actions";
    actions.append(createOwnerActionButton("HarajukuOwner-action HarajukuOwner-follow", "フォロー", follow, "☆"));
    const support = document.createElement("a");
    support.className = "HarajukuOwner-action HarajukuOwner-support";
    support.href = supportSource?.href || `https://creator-support.nicovideo.jp/registration/${owner.profileHref.split("/").pop()}?ref=pc_video_watch`;
    support.setAttribute("aria-label", "サポーター登録");
    support.append(cloneActionIcon(supportSource, "♡"));
    actions.append(support, createOwnerMenu(menuSource));
    panel.append(iconLink, body, actions);
    return panel;
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
    const owner = readOwnerApiMetadata();
    const signature = [...META_ITEMS.map((item) => values[item.source] || "-"), owner?.name || "-", owner?.profileHref || "-"].join("\n");
    if (chrome.dataset.hySignature === signature && (!owner || document.querySelector(".HarajukuOwner"))) return true;
    chrome.dataset.hySignature = signature;

    for (const item of META_ITEMS) {
      const value = chrome.querySelector(`.HarajukuStats [data-hy-key="${item.key}"] .HarajukuStats-value`);
      if (value) value.textContent = values[item.source] || "-";
    }

    document.querySelectorAll(".HarajukuOwner").forEach((node) => node.remove());
    if (owner) document.querySelector(SELECTORS.bottom)?.append(createOwnerPanel(owner));

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
    void refreshOwnerApiMetadata();
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
