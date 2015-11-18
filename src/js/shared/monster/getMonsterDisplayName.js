module.exports = monster => {
  var name = monster.name;
  switch (name) {
    case 'Nidoran-m':
      return "Nidoran \u2642";
    case 'Nidoran-f':
      return "Nidoran \u2640";
    case 'Mr-mime':
      return 'Mr. Mime';
    case 'Farfetchd':
      return "Farfetch'd";
  }
  return name.replace(/-(?:ordinary|incarnate|normal|aria|plant|altered)$/, '');
};