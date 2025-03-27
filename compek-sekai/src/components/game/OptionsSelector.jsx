const OptionsSelector = ({ options, onSelect, loading }) => {
	return (
		<div className="flex flex-col gap-2">
			<h3 className="font-bold">Your Response:</h3>
			{loading ? (
				<div className="flex justify-center p-4">
					<span className="loading loading-spinner"></span>
				</div>
			) : (
				options?.map((option) => (
					<button key={option.option_id} className="btn btn-outline w-full justify-start text-left mb-2 h-auto py-3" onClick={() => onSelect(option)} disabled={loading}>
						<span className="pr-2 font-bold">{option.option_id}:</span> {option.dialogue_text}
					</button>
				))
			)}
		</div>
	);
};

export default OptionsSelector;
