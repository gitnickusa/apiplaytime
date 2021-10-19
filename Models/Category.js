module.exports = function Category(sequelize, Sequelize) {
  return sequelize.define('Category', {
    name: {
      type: Sequelize.STRING,
    },   
    heading: {
      type: Sequelize.STRING,
    },
    details: {
      type: Sequelize.STRING,
    },
    image: {
      type: Sequelize.STRING,
    },
    onHomePage: {
      type: Sequelize.BOOLEAN,
    },
  });
};
