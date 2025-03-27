import { useState, useEffect, useCallback } from "react";
import { api } from "../../services/axios";

const CharactersPanel = ({ sessionId }) => {
	const [state, setState] = useState({
		characters: [],
		loading: false,
		error: null,
	});

	const fetchCharacters = useCallback(async () => {
		setState((prev) => ({ ...prev, loading: true, error: null }));
		try {
			const response = await api.get(`/game/session/${sessionId}/characters`);
			setState({ characters: response.data.characters, loading: false, error: null });
		} catch (err) {
			console.error("Failed to fetch characters:", err);
			setState({ characters: [], loading: false, error: "Failed to load characters. Please try again." });
		}
	}, [sessionId]);

	useEffect(() => {
		if (sessionId) fetchCharacters();
	}, [sessionId, fetchCharacters]);

	const getInitials = (name) =>
		name
			?.split(" ")
			.map((word) => word[0])
			.join("")
			.substring(0, 2)
			.toUpperCase() || "??";

	const getCharacterStatus = (character) => character.short_description?.split(".")[0] || character.current_emotional_state || character.personality_traits?.slice(0, 2).join(", ") || "Unknown";

	if (state.loading) {
		return (
			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					<h2 className="card-title">Characters Present</h2>
					<div className="flex justify-center p-4">
						<span className="loading loading-spinner"></span>
					</div>
				</div>
			</div>
		);
	}

	if (state.error) {
		return (
			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					<h2 className="card-title">Characters Present</h2>
					<p className="text-center p-4 text-red-500">{state.error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="card bg-base-100 shadow-xl">
			<div className="card-body">
				<h2 className="card-title">Characters Present</h2>
				{state.characters.length > 0 ? (
					<div className="grid grid-cols-1 gap-4">
						{state.characters.map((character) => (
							<div key={character.id} className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
								<div className="avatar placeholder">
									<div className="bg-primary text-primary-content rounded-full w-12">
										<span>{getInitials(character.name)}</span>
									</div>
								</div>
								<div>
									<p className="font-bold">{character.name}</p>
									<p className="text-sm opacity-70">{getCharacterStatus(character)}</p>
								</div>
							</div>
						))}
					</div>
				) : (
					<p className="text-center p-4">No characters present in this area.</p>
				)}
			</div>
		</div>
	);
};

export default CharactersPanel;
