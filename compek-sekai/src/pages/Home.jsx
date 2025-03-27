import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { getGameSessions } from "../redux/slices/gameSlice";
import Swal from "sweetalert2";

const Home = () => {
	const dispatch = useDispatch();
	const { isAuthenticated, user } = useSelector((state) => state.auth);
	const { sessions, loading } = useSelector((state) => state.game);
	const navigate = useNavigate();

	useEffect(() => {
		if (isAuthenticated && user) {
			dispatch(getGameSessions());
		}
	}, [dispatch, isAuthenticated, user]);

	const handleContinueGame = () => {
		if (sessions.length === 0) return;

		// Get the most recent active session
		const mostRecentSession = sessions.find((session) => session.status === "active") || sessions[0];

		Swal.fire({
			title: "Loading Previous Session",
			text: "Resuming your adventure...",
			icon: "info",
			timer: 1500,
			showConfirmButton: false,
		});

		// Navigate to game with the session ID
		navigate(`/game?sessionId=${mostRecentSession.id}`);
	};

	return (
		<div className="hero min-h-[80vh]">
			<div className="hero-content text-center">
				<div className="max-w-md">
					<h1 className="text-5xl font-bold">Compek Sekai</h1>
					<p className="py-6">Welcome to Compek Sekai, an immersive adventure in the Overlord universe where your choices shape your destiny. Encounter powerful beings, navigate treacherous situations, and try to survive in a world full of danger.</p>

					{isAuthenticated ? (
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link to="/game" className="btn btn-primary">
								New Adventure
							</Link>

							{sessions.length > 0 && (
								<button onClick={handleContinueGame} className="btn btn-secondary">
									Continue Adventure
								</button>
							)}

							<Link to="/sessions" className="btn btn-accent">
								Load Game
							</Link>

							{loading && <span className="loading loading-spinner loading-md"></span>}
						</div>
					) : (
						<Link to="/login" className="btn btn-primary">
							Login to Play
						</Link>
					)}
				</div>
			</div>
		</div>
	);
};

export default Home;
