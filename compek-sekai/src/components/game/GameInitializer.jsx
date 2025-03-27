const GameInitializer = ({ onInitGame }) => {
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh]">
			<h1 className="text-3xl font-bold mb-4">Preparing Your Adventure</h1>
			<button className="btn btn-primary" onClick={onInitGame}>
				Start New Game
			</button>
		</div>
	);
};

export default GameInitializer;
