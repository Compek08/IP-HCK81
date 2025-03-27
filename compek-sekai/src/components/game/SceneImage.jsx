const SceneImage = ({ currentScene }) => {
	const getSceneImage = () => {
		switch (currentScene) {
			case "starting_village":
				return "https://static.wikia.nocookie.net/overlordmaruyama/images/e/e5/Overlord_III_EP03_040.png";
			default:
				return "https://static.wikia.nocookie.net/overlordmaruyama/images/e/e5/Overlord_III_EP03_040.png";
		}
	};

	return (
		<figure>
			<img src={getSceneImage()} alt="Game Scene" className="w-full h-64 object-cover" />
		</figure>
	);
};

export default SceneImage;
