'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('DialogueHistories', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            sessionId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'GameSessions',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            speaker_id: {
                type: Sequelize.STRING,
                allowNull: false
            },
            dialogue: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            timestamp: {
                type: Sequelize.DATE,
                allowNull: false
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('DialogueHistories');
    }
};