(function () {
  "use strict";
  const { model, predict, validate } = window.CIPModel;
  const binaryPredictors = model.predictors.filter((item) => item.type === "binary");
  const $ = (selector) => document.querySelector(selector);
  const els = {
    form: $("#calculator"), factorList: $("#factor-list"), creatinine: $("#serum-creatinine"), creatinineField: $("#creatinine-field"), creatinineError: $("#creatinine-error"),
    heroRisk: $("#hero-risk"), heroStatus: $("#hero-status"), emptyResult: $("#empty-result"), resultContent: $("#result-content"), riskPercent: $("#risk-percent"), riskMarker: $("#risk-marker"),
    logitValue: $("#logit-value"), selectedCount: $("#selected-count"), creatinineValue: $("#creatinine-value"), contributionSection: $("#contribution-section"), contributionList: $("#contribution-list"),
    formula: $("#formula"), parameterTable: $("#parameter-table"),
  };

  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  const formatP = (value) => value < 0.001 ? "<0.001" : value.toFixed(3);
  const formatRisk = (value) => `${(value * 100).toFixed(1)}%`;

  function renderInputs() {
    els.factorList.innerHTML = binaryPredictors.map((item) => `
      <fieldset class="factor">
        <legend class="sr-only">${escapeHtml(item.label)}</legend>
        <div class="factor-copy"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.description)}</span></div>
        <div class="segmented-control">
          <input id="${item.key}-no" name="${item.key}" type="radio" value="0" checked><label for="${item.key}-no">No</label>
          <input id="${item.key}-yes" name="${item.key}" type="radio" value="1"><label for="${item.key}-yes">Yes</label>
        </div>
      </fieldset>`).join("");
  }

  function renderModelDetails() {
    const terms = model.predictors.map((item) => `${item.coefficient.toFixed(4)} × ${escapeHtml(item.label)}`);
    els.formula.innerHTML = `<code>logit = ${model.intercept.toFixed(4)} + ${terms.join(" + ")}</code><p>Predicted risk = 1 / (1 + e<sup>−logit</sup>)</p>`;
    els.parameterTable.innerHTML = model.predictors.map((item) => `
      <tr><th scope="row">${escapeHtml(item.label)}</th><td>${item.coefficient.toFixed(4)}</td><td>${item.oddsRatio.toFixed(2)} (${item.ci[0].toFixed(2)}–${item.ci[1].toFixed(2)})</td><td>${formatP(item.pValue)}</td></tr>`).join("");
  }

  function readValues() {
    const values = { Serum_creatinine: els.creatinine.value === "" ? NaN : Number(els.creatinine.value) };
    binaryPredictors.forEach((item) => { values[item.key] = Number(els.form.elements[item.key].value); });
    return values;
  }

  function showErrors(errors) {
    const message = errors.Serum_creatinine || "";
    els.creatinineError.textContent = message;
    els.creatinineField.classList.toggle("invalid", Boolean(message));
    els.creatinine.setAttribute("aria-invalid", String(Boolean(message)));
  }

  function renderContributions(result) {
    const max = Math.max(...result.contributions.map((item) => item.contribution), 0.01);
    els.contributionList.innerHTML = result.contributions.map((item) => {
      const width = Math.max(0, (item.contribution / max) * 100);
      const displayValue = item.key === "Serum_creatinine" ? `${item.value.toFixed(1)} µmol/L` : item.value ? "Yes" : "No";
      return `<div class="contribution-row"><div class="contribution-label"><strong>${escapeHtml(item.label)}</strong><span>${displayValue}</span></div><div class="contribution-track"><span style="width:${width.toFixed(2)}%"></span></div><output>+${item.contribution.toFixed(3)}</output></div>`;
    }).join("");
  }

  function renderResult(result, values) {
    const risk = formatRisk(result.probability);
    els.heroRisk.textContent = risk;
    els.heroStatus.textContent = "Model-based probability";
    els.emptyResult.hidden = true;
    els.resultContent.hidden = false;
    els.riskPercent.textContent = risk;
    els.riskMarker.style.left = `${Math.min(100, Math.max(0, result.probability * 100)).toFixed(2)}%`;
    els.logitValue.textContent = result.logit.toFixed(4);
    els.selectedCount.textContent = `${result.positiveBinaryCount} / ${binaryPredictors.length}`;
    els.creatinineValue.textContent = `${values.Serum_creatinine.toFixed(1)} µmol/L`;
    els.contributionSection.hidden = false;
    renderContributions(result);
  }

  function calculate(event) {
    if (event) event.preventDefault();
    const values = readValues();
    const errors = validate(values);
    showErrors(errors);
    if (Object.keys(errors).length) {
      els.creatinine.focus();
      return;
    }
    renderResult(predict(values), values);
  }

  function resetOutput() {
    showErrors({});
    els.heroRisk.textContent = "—";
    els.heroStatus.textContent = "Complete the patient information";
    els.emptyResult.hidden = false;
    els.resultContent.hidden = true;
    els.contributionSection.hidden = true;
  }

  renderInputs();
  renderModelDetails();
  els.form.addEventListener("submit", calculate);
  els.form.addEventListener("reset", () => window.setTimeout(resetOutput, 0));
  els.creatinine.addEventListener("input", () => { if (els.creatinine.getAttribute("aria-invalid") === "true") showErrors(validate(readValues())); });
})();
