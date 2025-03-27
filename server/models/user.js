'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            // User has many GameSessions
            User.hasMany(models.GameSession, { foreignKey: 'userId' });
        }
    }
    User.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Name is required' }
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: { msg: 'Must be a valid email address' },
                notEmpty: { msg: 'Email is required' }
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Password is required' },
                len: { args: [6, 100], msg: 'Password must be at least 6 characters' }
            }
        },
        googleId: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'User',
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            }
        }
    });

    // Instance method to check password
    User.prototype.checkPassword = async function (password) {
        return await bcrypt.compare(password, this.password);
    };

    return User;
};