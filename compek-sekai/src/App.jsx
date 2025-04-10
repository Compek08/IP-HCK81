import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { verifyToken } from "./redux/slices/authSlice";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Game from "./pages/Game";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Loading from "./components/Loading";
import UserSessions from "./pages/UserSessions";
import "./App.css";

function App() {
	const dispatch = useDispatch();
	const { isAuthenticated, loading } = useSelector((state) => state.auth);

	useEffect(() => {
		if (localStorage.getItem("token")) {
			dispatch(verifyToken());
		}
	}, [dispatch]);

	if (loading) {
		return <Loading />;
	}

	return (
		<Router>
			<div className="min-h-screen bg-base-200">
				<Navbar />
				<div className="container mx-auto px-4 py-8">
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
						<Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
						<Route path="/game" element={isAuthenticated ? <Game /> : <Navigate to="/login" />} />
						<Route path="/sessions" element={isAuthenticated ? <UserSessions /> : <Navigate to="/login" />} />
						<Route path="*" element={<NotFound />} />
					</Routes>
				</div>
			</div>
		</Router>
	);
}

export default App;
