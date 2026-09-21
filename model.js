(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.CIPModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const model = Object.freeze({
    name: "CIP_Prediction_Model_2026_09",
    intercept: -4.22528841827508,
    creatinineRange: Object.freeze({ min: 40, max: 260, unit: "µmol/L" }),
    predictors: Object.freeze([
      Object.freeze({ key: "Radiotherapy1", label: "Radiotherapy", description: "History of thoracic radiotherapy.", type: "binary", coefficient: 1.75560227137642, oddsRatio: 5.78693199611675, ci: [2.91158794242822, 11.5018273841837], pValue: 5.4597804714079e-7 }),
      Object.freeze({ key: "Reticular_opacities1", label: "Reticular opacities", description: "Reticular opacities present on baseline imaging.", type: "binary", coefficient: 1.12757153019604, oddsRatio: 3.08814791266982, ci: [1.28454402775824, 7.42415777462308], pValue: 0.01175154996175 }),
      Object.freeze({ key: "Heart_disease1", label: "Heart disease", description: "History of heart disease.", type: "binary", coefficient: 1.16852167379068, oddsRatio: 3.21723300137973, ci: [1.04463884072404, 9.90829345191953], pValue: 0.041740808398424 }),
      Object.freeze({ key: "COPD1", label: "Chronic obstructive pulmonary disease", description: "History of COPD.", type: "binary", coefficient: 0.864630360364469, oddsRatio: 2.37412835182577, ci: [1.2625867837909, 4.46423604563596], pValue: 0.00728105030555484 }),
      Object.freeze({ key: "Lung_surgery1", label: "Lung surgery", description: "History of lung surgery.", type: "binary", coefficient: 0.665227067503401, oddsRatio: 1.94493210207732, ci: [0.928702579097845, 4.07316719779709], pValue: 0.077753124797719 }),
      Object.freeze({ key: "Serum_creatinine", label: "Serum creatinine", description: "Pretreatment serum creatinine concentration.", type: "continuous", coefficient: 0.0199672367712955, oddsRatio: 1.02016791548448, ci: [1.00466557304767, 1.03590946450652], pValue: 0.0105942772333322 }),
    ]),
  });

  function logistic(value) {
    if (value >= 0) {
      const z = Math.exp(-value);
      return 1 / (1 + z);
    }
    const z = Math.exp(value);
    return z / (1 + z);
  }

  function validate(values) {
    const errors = {};
    model.predictors.filter((item) => item.type === "binary").forEach((item) => {
      if (values[item.key] !== 0 && values[item.key] !== 1) errors[item.key] = "Select Yes or No.";
    });
    const creatinine = Number(values.Serum_creatinine);
    if (!Number.isFinite(creatinine)) errors.Serum_creatinine = "Enter serum creatinine.";
    else if (creatinine < model.creatinineRange.min || creatinine > model.creatinineRange.max) {
      errors.Serum_creatinine = `Enter a value from ${model.creatinineRange.min} to ${model.creatinineRange.max} µmol/L.`;
    }
    return errors;
  }

  function predict(values) {
    const errors = validate(values);
    if (Object.keys(errors).length) {
      const error = new Error("Invalid predictor values");
      error.fields = errors;
      throw error;
    }
    const contributions = model.predictors.map((item) => ({
      key: item.key,
      label: item.label,
      value: Number(values[item.key]),
      contribution: item.coefficient * Number(values[item.key]),
    }));
    const logit = contributions.reduce((total, item) => total + item.contribution, model.intercept);
    return {
      logit,
      probability: logistic(logit),
      contributions,
      positiveBinaryCount: model.predictors.filter((item) => item.type === "binary" && Number(values[item.key]) === 1).length,
    };
  }

  return Object.freeze({ model, logistic, validate, predict });
});
