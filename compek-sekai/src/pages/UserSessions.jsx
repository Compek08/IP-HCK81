import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getGameSessions } from "../redux/slices/gameSlice";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { api } from "../services/axios";

const UserSessions = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { sessions, loading, error } = useSelector((state) => state.game);

	useEffect(() => {
		dispatch(getGameSessions());
	}, [dispatch]);

	const handleContinue = (sessionId) => {
		navigate(`/game?sessionId=${sessionId}`);
	};

	const handleDelete = async (sessionId) => {
		Swal.fire({
			title: "Are you sure?",
			text: "This will permanently delete the session.",
			icon: "warning",
			showCancelButton: true,
			confirmButtonText: "Yes, delete it!",
			cancelButtonText: "Cancel",
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					// Call API to delete the session
					await api.delete(`/game/session/${sessionId}`);

					// Show success message
					Swal.fire("Deleted!", "Your session has been deleted.", "success");

					// Refresh the sessions list
					dispatch(getGameSessions());
				} catch (error) {
					// Show error message if deletion fails
					Swal.fire("Error!", "Failed to delete the session. Please try again.", "error");
					console.error("Failed to delete session:", error);
				}
			}
		});
	};

	if (loading) {
		return (
			<div className="flex justify-center p-4">
				<span className="loading loading-spinner loading-lg"></span>
			</div>
		);
	}

	if (error) {
		return <div className="text-center text-error">{error}</div>;
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">Your Game Sessions</h1>
			{sessions.length === 0 ? (
				<p className="text-center">No sessions found. Start a new adventure!</p>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{sessions.map((session) => (
						<div key={session.id} className="card bg-base-100 shadow-md">
							<div className="card-body">
								<h2 className="card-title">Session #{session.id}</h2>
								<p>Status: {session.status}</p>
								<p>Last Updated: {new Date(session.updatedAt).toLocaleString()}</p>
								<div className="flex gap-2 mt-4">
									<button onClick={() => handleContinue(session.id)} className="btn btn-primary">
										Continue
									</button>
									<button onClick={() => handleDelete(session.id)} className="btn btn-error">
										Delete
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default UserSessions;
