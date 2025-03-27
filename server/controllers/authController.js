// Update all user references to User
const { User } = require("../models");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const authController = {
	async register(req, res) {
		try {
			const { name, email, password } = req.body;

			// Check if user already exists
			const existingUser = await User.findOne({ where: { email } });
			if (existingUser) {
				return res.status(400).json({ error: "Email already registered" });
			}

			// Create new user
			const newUser = await User.create({
				name,
				email,
				password,
			});

			// Generate JWT token
			const token = jwt.sign({ id: newUser.id, email: newUser.email, name: newUser.name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });

			res.status(201).json({
				message: "User registered successfully",
				token,
				user: {
					id: newUser.id,
					name: newUser.name,
					email: newUser.email,
				},
			});
		} catch (error) {
			console.error("Registration error:", error);
			if (error.name === "SequelizeValidationError") {
				return res.status(400).json({
					error: "Validation error",
					details: error.errors.map((e) => e.message),
				});
			}
			res.status(500).json({ error: "Failed to register user" });
		}
	},

	async login(req, res) {
		try {
			const { email, password } = req.body;

			// Find user by email
			const foundUser = await User.findOne({ where: { email } });
			if (!foundUser) {
				return res.status(401).json({ error: "Invalid credentials" });
			}

			// Check password
			const isPasswordValid = await foundUser.checkPassword(password);
			if (!isPasswordValid) {
				return res.status(401).json({ error: "Invalid credentials" });
			}

			// Generate JWT token
			const token = jwt.sign({ id: foundUser.id, email: foundUser.email, name: foundUser.name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });

			res.json({
				message: "Login successful",
				token,
				user: {
					id: foundUser.id,
					name: foundUser.name,
					email: foundUser.email,
				},
			});
		} catch (error) {
			console.error("Login error:", error);
			res.status(500).json({ error: "Failed to login" });
		}
	},

	async googleLogin(req, res) {
		try {
			const { idToken } = req.body;

			// Verify the Google token
			const ticket = await googleClient.verifyIdToken({
				idToken,
				audience: process.env.GOOGLE_CLIENT_ID,
			});

			const payload = ticket.getPayload();
			console.log("Google payload:", payload);

			const { email, name, sub, picture } = payload;

			// Find or create user
			let foundUser = await User.findOne({ where: { email } });
			let isNewUser = false;

			if (!foundUser) {
				// Create new user with Google credentials
				foundUser = await User.create({
					name,
					email,
					// Generate a random password for the user
					password: Math.random().toString(36).slice(-16) + Date.now().toString(),
					googleId: sub,
				});
				isNewUser = true;
			} else {
				// Update googleId if not already set
				if (!foundUser.googleId) {
					await foundUser.update({ googleId: sub });
				}
			}

			// Generate JWT token
			const token = jwt.sign(
				{
					id: foundUser.id,
					email: foundUser.email,
					name: foundUser.name,
					googleId: foundUser.googleId,
				},
				process.env.JWT_SECRET
				// { expiresIn: process.env.JWT_EXPIRATION }
			);

			res.json({
				message: isNewUser ? "Google signup successful" : "Google login successful",
				token,
				user: {
					id: foundUser.id,
					name: foundUser.name,
					email: foundUser.email,
					picture: picture || null,
					isNewUser,
				},
			});
		} catch (error) {
			console.error("Google login error:", error);
			res.status(500).json({ error: "Failed to authenticate with Google" });
		}
	},

	// To verify if token is valid
	async verifyToken(req, res) {
		res.json({
			message: "Token is valid",
			user: req.user,
		});
	},
};

module.exports = authController;
