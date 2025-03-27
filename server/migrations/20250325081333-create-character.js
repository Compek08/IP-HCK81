"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Characters", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            character_id: {
                type: Sequelize.STRING
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            sessionId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "GameSessions",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: 'SET NULL'
            },
            short_description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            personality_traits: {
                type: Sequelize.ARRAY(Sequelize.STRING),
                allowNull: true,
            },
            relationship_to_user: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            current_emotional_state: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            goals_in_scene: {
                type: Sequelize.ARRAY(Sequelize.STRING),
                allowNull: true,
            },
            speaking_style: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            hidden_information: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            power_level: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            faction: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            perceived_threat_level_of_user: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("Characters");
    },
};
