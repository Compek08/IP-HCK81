'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('GameSessions', 'playerHealth', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 100
        });

        await queryInterface.addColumn('GameSessions', 'playerMaxHealth', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 100
        });

        await queryInterface.addColumn('GameSessions', 'playerLevel', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 1
        });

        await queryInterface.addColumn('GameSessions', 'playerExp', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
        });

        await queryInterface.addColumn('GameSessions', 'playerGold', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 10
        });

        await queryInterface.addColumn('GameSessions', 'playerInventory', {
            type: Sequelize.JSON,
            allowNull: true
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('GameSessions', 'playerHealth');
        await queryInterface.removeColumn('GameSessions', 'playerMaxHealth');
        await queryInterface.removeColumn('GameSessions', 'playerLevel');
        await queryInterface.removeColumn('GameSessions', 'playerExp');
        await queryInterface.removeColumn('GameSessions', 'playerGold');
        await queryInterface.removeColumn('GameSessions', 'playerInventory');
    }
};