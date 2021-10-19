module.exports = function Product(sequelize, Sequelize) {
  return sequelize.define('Product', {
    productName: {
      type: Sequelize.STRING,
    },   
    shortDescription: {
      type: Sequelize.STRING,
    },
    productDetail: {
      type: Sequelize.STRING,
    },
    count: {
      type: Sequelize.STRING,
    },
     size: {
      type: Sequelize.STRING,
    },
    image: {
      type: Sequelize.STRING,
    },
    price: {
      type: Sequelize.STRING,
    },
    category: {
      type: Sequelize.STRING,
    },
  });
};
