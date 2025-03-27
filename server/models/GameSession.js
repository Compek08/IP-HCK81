'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class GameSession extends Model {
        static associate(models) {
            // GameSession has many DialogueHistory entries
            GameSession.hasMany(models.DialogueHistory, { foreignKey: 'sessionId' });

            // GameSession belongs to a user
            GameSession.belongsTo(models.User, { foreignKey: 'userId' });
        }
    }
    GameSession.init({
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        currentScene: {
            type: DataTypes.STRING,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('active', 'completed', 'game_over'),
            defaultValue: 'active'
        },
        playerHealth: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 100
        },
        playerMaxHealth: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 100
        },
        playerLevel: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        playerExp: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        playerGold: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 10
        },
        playerInventory: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: JSON.stringify({
                items: [
                    { id: 1, name: "Health Potion (Small)", quantity: 3, effect: "Restores 20 HP" },
                    { id: 2, name: "Basic Sword", quantity: 1, effect: "5 ATK" },
                    { id: 3, name: "Leather Armor", quantity: 1, effect: "10 DEF" }
                ]
            })
        }
    }, {
        sequelize,
        modelName: 'GameSession',
    });
    return GameSession;
};