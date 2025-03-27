import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { register } from "../redux/slices/authSlice";
import Loading from "../components/Loading";

const Register = () => {
	const dispatch = useDispatch();
	const { loading, error } = useSelector((state) => state.auth);
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [passwordError, setPasswordError] = useState("");

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});

		// Clear password match error when either password field changes
		if (e.target.name === "password" || e.target.name === "confirmPassword") {
			setPasswordError("");
		}
	};

	const handleSubmit = (e) => {
		e.preventDefault();

		// Check if passwords match
		if (formData.password !== formData.confirmPassword) {
			setPasswordError("Passwords do not match");
			return;
		}

		// Remove confirmPassword before sending to API
		const { confirmPassword, ...registerData } = formData;
		dispatch(register(registerData));
	};

	if (loading) return <Loading />;

	return (
		<div className="flex justify-center">
			<div className="card w-full max-w-md bg-base-100 shadow-xl">
				<div className="card-body">
					<h2 className="card-title text-2xl font-bold text-center mb-6">Create an Account</h2>

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
								<span className="label-text">Name</span>
							</label>
							<input type="text" name="name" placeholder="Your name" className="input input-bordered" value={formData.name} onChange={handleChange} required />
						</div>

						<div className="form-control mb-4">
							<label className="label">
								<span className="label-text">Email</span>
							</label>
							<input type="email" name="email" placeholder="youremail@example.com" className="input input-bordered" value={formData.email} onChange={handleChange} required />
						</div>

						<div className="form-control mb-4">
							<label className="label">
								<span className="label-text">Password</span>
							</label>
							<input type="password" name="password" placeholder="••••••••" className="input input-bordered" value={formData.password} onChange={handleChange} required minLength={6} />
							<label className="label">
								<span className="label-text-alt">Password must be at least 6 characters</span>
							</label>
						</div>

						<div className="form-control mb-6">
							<label className="label">
								<span className="label-text">Confirm Password</span>
							</label>
							<input type="password" name="confirmPassword" placeholder="••••••••" className={`input input-bordered ${passwordError ? "input-error" : ""}`} value={formData.confirmPassword} onChange={handleChange} required />
							{passwordError && (
								<label className="label">
									<span className="label-text-alt text-error">{passwordError}</span>
								</label>
							)}
						</div>

						<div className="form-control">
							<button type="submit" className="btn btn-primary" disabled={loading}>
								{loading ? <span className="loading loading-spinner"></span> : "Register"}
							</button>
						</div>
					</form>

					<div className="text-center mt-4">
						<p>
							Already have an account?{" "}
							<Link to="/login" className="text-primary">
								Login here
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Register;
