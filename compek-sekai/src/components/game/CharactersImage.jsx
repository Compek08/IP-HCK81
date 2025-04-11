import { useEffect, useState } from "react";
import { api } from "../../services/axios";
import { client } from "@gradio/client";
import { base64ToBlob } from "../../services/converter";

export default function CharactersImage({ sessionId, updateTrigger }) {
	const [image, setImage] = useState(null);

	const fetchAndProcessImage = async () => {
		try {
			// Fetch the generated image from the server
			const response = await api.get(`/game/session/${sessionId}/imageGen`);

			const generatedImage = response.data.image.image;
			const blob = base64ToBlob(generatedImage, "image/png");

			// Remove background using Gradio
			const gradioClient = await client("https://briaai-bria-rmbg-1-4.hf.space/--replicas/awfs5/");
			const result = await gradioClient.predict("/predict", [blob]);
			console.log(result.data, "result from gradio");

			setImage(result.data[0]); // Set the processed image
		} catch (error) {
			console.error("Error fetching or processing image:", error);
		}
	};

	useEffect(() => {
		if (sessionId) {
			fetchAndProcessImage();
		}
	}, [sessionId, updateTrigger]); // Re-fetch image when updateTrigger changes

	if (!image) return null;

	return (
		<div className="fixed bottom-4 right-4">
			<img src={`https://briaai-bria-rmbg-1-4.hf.space/--replicas/awfs5/file=${image.path}`} alt="Character" className="w-auto h-auto rounded-lg shadow-lg" style={{ transform: "scale(0.5)", transformOrigin: "bottom right" }} />
		</div>
	);
}
