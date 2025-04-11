import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { initGame, getOptions, selectOption } from "../redux/slices/gameSlice";
import Loading from "../components/Loading";
import Swal from "sweetalert2";
import DialogueBox from "../components/game/DialogueBox";
import OptionsSelector from "../components/game/OptionsSelector";
import PlayerInfo from "../components/game/PlayerInfo";
import CharactersPanel from "../components/game/CharactersPanel";
import SceneImage from "../components/game/SceneImage";
import GameInitializer from "../components/game/GameInitializer";
import CharactersImage from "../components/game/CharactersImage";
import GameOver from "../components/game/GameOver"; // Import komponen Game Over

const Game = () => {
	const dispatch = useDispatch();
	const [searchParams] = useSearchParams();
	const sessionIdParam = searchParams.get("sessionId");
	const { user } = useSelector((state) => state.auth);
	const { sessionId, options, loading, error, currentScene, dialogueHistory } = useSelector((state) => state.game);
	const [dialogue, setDialogue] = useState([]);
	const playerInfoRef = useRef();
	const [updateImageTrigger, setUpdateImageTrigger] = useState(false);
	const [isGameOver, setIsGameOver] = useState(false);

	useEffect(() => {
		if (sessionIdParam) {
			// If we have a sessionId from URL parameter, use it
			dispatch({
				type: "game/setSessionId",
				payload: sessionIdParam,
			});
			dispatch(getOptions(sessionIdParam)); // Load options immediately
		} else {
			// Start a new game if no sessionId

			dispatch(initGame());
		}
	}, [dispatch, sessionIdParam]);

	// Update local dialogue from redux dialogueHistory when it changes
	useEffect(() => {
		if (dialogueHistory && dialogueHistory.length > 0) {
			const formattedDialogue = dialogueHistory.map((item) => ({
				speaker: getSpeakerName(item.speaker_id),
				text: item.dialogue,
				timestamp: new Date(item.timestamp).toISOString(),
				isNarrator: item.speaker_id === "NARRATOR",
			}));
			setDialogue(formattedDialogue);

			// Fetch player status after option selection
			if (playerInfoRef.current) {
				playerInfoRef.current.fetchPlayerStatus();
			}
		}
	}, [dialogueHistory]);

	useEffect(() => {
		// Periksa status game atau HP pemain
		if (playerInfoRef.current) {
			playerInfoRef.current.fetchPlayerStatus().then((status) => {
				if (status.health <= 0 || status.status === "game_over") {
					setIsGameOver(true);
				}
			});
		}
	}, [dialogueHistory]); // Trigger saat dialogueHistory berubah

	const getSpeakerName = (speakerId) => {
		switch (speakerId) {
			case "NARRATOR":
				return "Narrator";
			case "USER":
				return "You";
			case "GUARD_ER_01":
				return "Gate Guard";
			case "GAZ_01":
				return "Gazef Stronoff";
			default:
				return speakerId;
		}
	};

	const handleOptionSelect = async (option) => {
		if (!sessionId) return;

		const newDialogueItem = {
			speaker: "You",
			text: option.dialogue_text,
			timestamp: new Date().toISOString(),
		};

		setDialogue((prev) => [...prev, newDialogueItem]);

		await dispatch(
			selectOption({
				sessionId,
				optionId: option.option_id,
				dialogue: option.dialogue_text,
			})
		);

		// Fetch player status after option selection
		if (playerInfoRef.current) {
			playerInfoRef.current.fetchPlayerStatus();
		}

		// Trigger image update
		setUpdateImageTrigger((prev) => !prev);
	};

	if (isGameOver) {
		return <GameOver />;
	}

	if (loading && !sessionId) {
		return <Loading />;
	}

	if (error) {
		Swal.fire({
			icon: "error",
			title: "Error",
			text: error,
		});
	}

	if (!sessionId && !sessionIdParam) {
		return <GameInitializer onInitGame={() => dispatch(initGame())} />;
	}

	return (
		<div className="flex flex-col md:flex-row gap-6">
			<div className="md:w-7/12">
				<div className="card bg-base-100 shadow-xl">
					<SceneImage currentScene={currentScene} />
					<div className="card-body">
						<h2 className="card-title">{currentScene === "starting_village" ? "E-Rantel Gate" : currentScene}</h2>
						<DialogueBox dialogue={dialogue} loading={loading} />
						<OptionsSelector options={options} onSelect={handleOptionSelect} loading={loading} />
					</div>
				</div>
			</div>

			<div className="md:w-5/12">
				<PlayerInfo ref={playerInfoRef} user={user} currentScene={currentScene} sessionId={sessionId} />
				<CharactersPanel sessionId={sessionId} />
			</div>

			{/* Add CharactersImage */}
			<CharactersImage sessionId={sessionId} updateTrigger={updateImageTrigger} />
		</div>
	);
};

export default Game;
