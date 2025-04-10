import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../redux/slices/authSlice";
import Loading from "../components/Loading";
import GoogleLoginButton from "../components/GoogleLoginButton";

const Login = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});

	useEffect(() => {
		if (isAuthenticated) {
			navigate("/");
		}
	}, [isAuthenticated, navigate]);

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		dispatch(login(formData));
	};

	if (loading) return <Loading />;

	return (
		<div className="flex justify-center">
			<div className="card w-full max-w-md bg-base-100 shadow-xl">
				<div className="card-body">
					<h2 className="card-title text-2xl font-bold text-center mb-6">Login to Your Account</h2>

					{error && (
						<div className="alert alert-error mb-4">
							<svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<span>{error}</span>
						</div>
					)}

					<form onSubmit={handleSubmit}>
						<div className="form-control mb-4">
							<label className="label">
								<span className="label-text">Email</span>
							</label>
							<input type="email" name="email" placeholder="youremail@example.com" className="input input-bordered" value={formData.email} onChange={handleChange} required />
						</div>

						<div className="form-control mb-6">
							<label className="label">
								<span className="label-text">Password</span>
							</label>
							<input type="password" name="password" placeholder="••••••••" className="input input-bordered" value={formData.password} onChange={handleChange} required />
						</div>

						<div className="form-control">
							<button type="submit" className="btn btn-primary" disabled={loading}>
								{loading ? <span className="loading loading-spinner"></span> : "Login"}
							</button>
						</div>
					</form>

					<div className="divider">OR</div>

					<div className="flex justify-center">
						<GoogleLoginButton />
					</div>

					<div className="text-center mt-4">
						<p>
							Don't have an account?{" "}
							<Link to="/register" className="text-primary">
								Register here
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;
