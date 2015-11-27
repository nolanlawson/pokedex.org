module.exports = name => {
  switch (name) {
    case 'Nidoran-m':
      return "Nidoran \u2642";
    case 'Nidoran-f':
      return "Nidoran \u2640";
    case 'Mr-mime':
      return 'Mr. Mime';
    case 'Mime-jr':
      return 'Mime Jr.';
    case 'Farfetchd':
      return "Farfetch'd";
  }
  return name.replace(/-(?:ordinary|incarnate|normal|aria|plant|altered|red-striped|land)$/, '');
};