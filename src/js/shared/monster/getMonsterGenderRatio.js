module.exports = supplemental => {
  var genderRatio = supplemental.genderRatio;
  if (genderRatio === 'N/A') {
    return 'N/A';
  }
  return `${genderRatio}% \u2642 ${100 - genderRatio}% \u2640`;
};