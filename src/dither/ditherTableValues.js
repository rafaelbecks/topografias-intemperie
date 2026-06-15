export function parseTableValuesToSlider(tableValues) {
  if (!tableValues) return 0;
  const values = tableValues
    .split(" ")
    .map((v) => parseFloat(v.trim()))
    .filter((v) => !Number.isNaN(v));
  if (values.length === 0) return 0;
  return values[0];
}

export function sliderToTableValues(sliderValue) {
  const value = Math.max(0, Math.min(1, sliderValue));
  return `${value} ${1 - value}`;
}
