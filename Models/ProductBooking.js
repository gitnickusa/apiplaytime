module.exports = function ProductBooking(sequelize, Sequelize) {
  return sequelize.define('ProductBooking', {
    productId: {
      type: Sequelize.STRING,
    },   
    bookingCount: {
      type: Sequelize.INTEGER,
    },
    startDate: {
      type: Sequelize.DATE,
    },
    endDate: {
      type: Sequelize.DATE,
    },
  });
};
