export default monster => {
  return (monster.types[1] || monster.types[0]).name;
};