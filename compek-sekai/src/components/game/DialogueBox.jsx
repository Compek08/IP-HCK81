import { useEffect, useRef } from "react";

const DialogueBox = ({ dialogue, loading }) => {
	const dialogueRef = useRef(null);

	useEffect(() => {
		if (dialogueRef.current) {
			dialogueRef.current.scrollTop = dialogueRef.current.scrollHeight;
		}
	}, [dialogue]);

	return (
		<div ref={dialogueRef} className="bg-base-200 p-4 rounded-lg max-h-60 overflow-y-auto mb-4">
			{dialogue.length === 0 ? (
				<div className="flex justify-center p-4">
					<span className="loading loading-spinner"></span>
				</div>
			) : (
				dialogue.map((item, index) =>
					item.isNarrator ? (
						<div key={index} className="prose text-center my-4 italic opacity-80">
							<p>{item.text}</p>
						</div>
					) : (
						<div key={index} className={`chat ${item.speaker === "You" ? "chat-end" : "chat-start"} mb-2`}>
							<div className="chat-header">{item.speaker}</div>
							<div className={`chat-bubble ${item.speaker === "You" ? "chat-bubble-primary" : ""}`}>{item.text}</div>
						</div>
					)
				)
			)}
		</div>
	);
};

export default DialogueBox;
