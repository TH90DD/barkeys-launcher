"use strict";
/* global BK, t, h, $, icon */

const REPO = "https://github.com/TH90DD/barkeys-launcher";

function creditLink(person) {
  return person.url
    ? h("a", { href: person.url, target: "_blank", rel: "noopener noreferrer", text: person.name })
    : h("span", { text: person.name });
}

function renderCredits() {
  const body = $("creditsBody");
  body.textContent = "";
  const c = BK.CREDITS;

  body.append(
    h("h3", { text: t("creditsAuthor") }),
    h("ul", { class: "credit-list" }, h("li", null, creditLink(c.author))),

    h("h3", { text: t("creditsContributors") }),
    c.contributors.length
      ? h("ul", { class: "credit-list" }, c.contributors.map(p => h("li", null, creditLink(p))))
      : h("p", { class: "muted", text: t("creditsNoContributors") }),
    h("p", { class: "muted small" }, t("creditsHowTo") + " ",
      h("a", { href: REPO + "/blob/main/CONTRIBUTING.md", target: "_blank", rel: "noopener noreferrer", text: t("creditsHowToLink") })),

    h("h3", { text: t("creditsTranslators") }),
    h("ul", { class: "credit-list" }, BK.LOCALES.map(l => h("li", null,
      h("span", { class: "tag", text: l.name }),
      (c.translators[l.code] || []).map((p, i) => [i ? ", " : "", creditLink(p)])))),

    h("h3", { text: t("creditsThirdParty") }),
    h("ul", { class: "credit-list" }, c.thirdParty.map(p => h("li", null,
      creditLink(p),
      h("span", { class: "tag", text: t("creditsIcons") }),
      h("a", { href: p.licenseUrl, target: "_blank", rel: "noopener noreferrer", class: "muted small", text: t("creditsLicense", p.license) })))),

    h("p", { class: "muted small", style: "margin-top:18px" }, t("creditsOwnLicense") + " ",
      h("a", { href: REPO + "/blob/main/LICENSE", target: "_blank", rel: "noopener noreferrer", text: "MPL-2.0" }))
  );
}

$("closeCredits").append(icon("close"));
$("openCredits").addEventListener("click", () => {
  renderCredits();
  $("credits").showModal();
});
$("closeCredits").addEventListener("click", () => $("credits").close());
// Click on the backdrop closes the dialog.
$("credits").addEventListener("click", e => { if (e.target === $("credits")) $("credits").close(); });
