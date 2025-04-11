import { useNavigate } from "react-router-dom";

const GameOver = () => {
	const navigate = useNavigate();

	const handleNewGame = () => {
		navigate("/game");
	};

	return (
		<div className="flex flex-col items-center justify-center h-screen bg-gray-800 text-white">
			<h1 className="text-4xl font-bold mb-4">Game Over</h1>
			<p className="mb-8">Your journey has come to an end.</p>
			<button className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white font-bold rounded" onClick={handleNewGame}>
				Start New Game
			</button>
		</div>
	);
};

export default GameOver;
