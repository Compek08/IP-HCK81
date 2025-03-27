import { Link } from "react-router-dom";

const NotFound = () => {
	return (
		<div className="hero min-h-[80vh]">
			<div className="hero-content text-center">
				<div className="max-w-md">
					<h1 className="text-5xl font-bold">404</h1>
					<p className="py-6">Oops! It seems you've wandered into uncharted territory. Even in the New World of Overlord, this page doesn't exist.</p>
					<Link to="/" className="btn btn-primary">
						Return to Safety
					</Link>
				</div>
			</div>
		</div>
	);
};

export default NotFound;
