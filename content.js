(function () {
  "use strict";

  const SUMMARY_SELECTOR = '[data-testid="index-summary"]';
  const FIELD_SELECTOR = '[data-testid="index-summary-field"]';
  const NAMESPACE_SELECTOR = '[data-testid="performance-advisor-card-namespace"]';
  const ENHANCED_ATTRIBUTE = "data-atlas-index-json";
  const TOOLBAR_CLASS = "atlas-index-json-toolbar";

  function parseIndexValue(rawValue) {
    const value = rawValue.trim();

    if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(value)) {
      return Number(value);
    }

    return value;
  }

  function parseIndexSummary(summary) {
    const index = Object.create(null);

    summary.querySelectorAll(FIELD_SELECTOR).forEach((field) => {
      const key = field.querySelector(".index-summary-key")?.textContent?.trim();
      const value = field.querySelector(".index-summary-value")?.textContent;

      if (key && value != null) {
        index[key] = parseIndexValue(value);
      }
    });

    return index;
  }

  function copyWithSelection(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.className = "atlas-index-json-clipboard";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();

    if (!copied) {
      throw new Error("The browser rejected the copy command");
    }
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (error) {
        console.debug("Atlas Index Exporter is using the clipboard fallback", error);
      }
    }

    copyWithSelection(text);
  }

  function createButton(label, title, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `atlas-index-json-button ${className}`;
    button.setAttribute("aria-label", label);
    button.title = title;
    return button;
  }

  function createToolbarButton(label, className) {
    const button = createButton(label, label, className);
    button.dataset.lgid = "lg-button";

    const icon = document.createElement("div");
    icon.className = "atlas-index-json-button-icon";
    icon.setAttribute("aria-hidden", "true");

    const buttonLabel = document.createElement("div");
    buttonLabel.className = "atlas-index-json-button-label";
    buttonLabel.textContent = label;

    button.append(icon, buttonLabel);
    return { button, icon, label: buttonLabel };
  }

  function setSummaryJsonState(summary, showingJson) {
    const jsonView = summary.querySelector(".atlas-index-json-view");
    const toggleButton = summary.querySelector(".atlas-index-json-toggle");

    if (!jsonView || !toggleButton) {
      return;
    }

    jsonView.textContent = JSON.stringify(parseIndexSummary(summary), null, 2);
    jsonView.hidden = !showingJson;
    summary.classList.toggle("atlas-index-json-active", showingJson);
    toggleButton.setAttribute("aria-pressed", String(showingJson));
    toggleButton.title = showingJson ? "Show rendered view" : "Toggle JSON view";
  }

  function getIndexSummaries(container) {
    return [...container.querySelectorAll(`${SUMMARY_SELECTOR}[${ENHANCED_ATTRIBUTE}]`)].filter(
      (summary) => summary.parentElement === container
    );
  }

  function serializeIndexSummaries(summaries) {
    return JSON.stringify([...summaries].map(parseIndexSummary), null, 2);
  }

  function findNamespace(container) {
    let current = container;

    while (current) {
      const namespace = current.querySelector?.(NAMESPACE_SELECTOR);
      if (namespace) {
        return namespace.textContent
          .replace(/\s+/g, " ")
          .replace(/\s*\.\s*/g, ".")
          .trim();
      }

      current = current.parentElement;
    }

    return "";
  }

  function addNamespaceComment(json, namespace) {
    return namespace ? `// Namespace: ${namespace}\n${json}` : json;
  }

  function getToolbar(container) {
    return [...container.children].find((child) =>
      child.classList.contains(TOOLBAR_CLASS)
    );
  }

  function updateToolbarState(container) {
    const toggleButton = getToolbar(container)?.querySelector(
      ".atlas-index-json-toggle-all"
    );
    if (!toggleButton) {
      return;
    }

    const summaries = getIndexSummaries(container);
    const allShowingJson =
      summaries.length > 0 &&
      summaries.every((summary) => summary.classList.contains("atlas-index-json-active"));
    const label = allShowingJson ? "Show All as Rendered" : "Show All as JSON";
    toggleButton.querySelector(".atlas-index-json-button-label").textContent = label;
    toggleButton.setAttribute("aria-label", label);
    toggleButton.title = label;
    toggleButton.setAttribute("aria-pressed", String(allShowingJson));
  }

  function ensureToolbar(container) {
    const summaries = getIndexSummaries(container);
    const firstSummary = summaries[0];
    if (!firstSummary || getToolbar(container)) {
      updateToolbarState(container);
      return;
    }

    const toolbar = document.createElement("div");
    toolbar.className = TOOLBAR_CLASS;

    const toggleAll = createToolbarButton(
      "Show All as JSON",
      "atlas-index-json-global-button atlas-index-json-toggle-all"
    );
    const toggleAllButton = toggleAll.button;
    toggleAllButton.setAttribute("aria-pressed", "false");
    toggleAll.icon.classList.add("atlas-index-json-json-icon");
    toggleAll.icon.textContent = "{}";

    const copyAll = createToolbarButton(
      "Copy All JSON",
      "atlas-index-json-global-button atlas-index-json-copy-all"
    );
    const copyAllButton = copyAll.button;
    copyAll.icon.classList.add("atlas-index-json-copy-icon");
    copyAll.icon.append(document.createElement("span"));

    toggleAllButton.addEventListener("click", () => {
      const scopedSummaries = getIndexSummaries(container);
      const allShowingJson = scopedSummaries.every((summary) =>
        summary.classList.contains("atlas-index-json-active")
      );
      scopedSummaries.forEach((summary) =>
        setSummaryJsonState(summary, !allShowingJson)
      );
      updateToolbarState(container);
    });

    copyAllButton.addEventListener("click", async () => {
      try {
        const json = serializeIndexSummaries(getIndexSummaries(container));
        await copyText(addNamespaceComment(json, findNamespace(container)));
        copyAllButton.classList.add("atlas-index-json-copied");
        copyAll.label.textContent = "Copied All";
        copyAllButton.title = "Copied All";
        window.setTimeout(() => {
          copyAllButton.classList.remove("atlas-index-json-copied");
          copyAll.label.textContent = "Copy All JSON";
          copyAllButton.title = "Copy All JSON";
        }, 1500);
      } catch (error) {
        console.error("Atlas Index Exporter could not copy all indexes", error);
        copyAllButton.title = "Copy failed";
      }
    });

    toolbar.append(toggleAllButton, copyAllButton);
    firstSummary.before(toolbar);
    updateToolbarState(container);
  }

  function enhanceIndexSummary(summary) {
    if (summary.hasAttribute(ENHANCED_ATTRIBUTE)) {
      return;
    }

    const getJson = () => JSON.stringify(parseIndexSummary(summary), null, 2);
    if (getJson() === "{}") {
      return;
    }

    const controls = document.createElement("div");
    controls.className = "atlas-index-json-controls";

    const toggleButton = createButton(
      "Toggle JSON view",
      "Toggle JSON view",
      "atlas-index-json-toggle"
    );
    toggleButton.textContent = "{}";
    toggleButton.setAttribute("aria-pressed", "false");

    const copyButton = createButton(
      "Copy index as JSON",
      "Copy index as JSON",
      "atlas-index-json-copy"
    );
    copyButton.append(document.createElement("span"));

    const jsonView = document.createElement("pre");
    jsonView.className = "atlas-index-json-view";
    jsonView.textContent = getJson();
    jsonView.hidden = true;

    toggleButton.addEventListener("click", () => {
      const showingJson = jsonView.hidden;
      setSummaryJsonState(summary, showingJson);
      updateToolbarState(summary.parentElement);
    });

    copyButton.addEventListener("click", async () => {
      try {
        await copyText(
          addNamespaceComment(getJson(), findNamespace(summary.parentElement))
        );
        copyButton.classList.add("atlas-index-json-copied");
        copyButton.title = "Copied";
        window.setTimeout(() => {
          copyButton.classList.remove("atlas-index-json-copied");
          copyButton.title = "Copy index as JSON";
        }, 1500);
      } catch (error) {
        console.error("Atlas Index Exporter could not copy the index", error);
        copyButton.title = "Copy failed";
      }
    });

    controls.append(toggleButton, copyButton);
    summary.append(controls, jsonView);
    summary.setAttribute(ENHANCED_ATTRIBUTE, "");
  }

  function enhancePage(root = document) {
    if (root.matches?.(SUMMARY_SELECTOR)) {
      enhanceIndexSummary(root);
    }

    root.querySelectorAll?.(SUMMARY_SELECTOR).forEach(enhanceIndexSummary);
    const containers = new Set(
      [...document.querySelectorAll(`${SUMMARY_SELECTOR}[${ENHANCED_ATTRIBUTE}]`)].map(
        (summary) => summary.parentElement
      )
    );
    containers.forEach(ensureToolbar);
  }

  if (typeof document !== "undefined") {
    enhancePage();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            enhancePage(node);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (typeof module !== "undefined") {
    module.exports = {
      parseIndexSummary,
      parseIndexValue,
      getIndexSummaries,
      findNamespace,
      addNamespaceComment,
      serializeIndexSummaries,
    };
  }
})();