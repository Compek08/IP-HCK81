import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/slices/authSlice";
import ThemeSwitcher from "./ThemeSwitcher";
import Swal from "sweetalert2";

const Navbar = () => {
	const dispatch = useDispatch();
	const { isAuthenticated, user } = useSelector((state) => state.auth);

	const handleLogout = () => {
		Swal.fire({
			title: "Logout?",
			text: "You will be logged out of your account",
			icon: "warning",
			showCancelButton: true,
			confirmButtonText: "Yes, logout",
			cancelButtonText: "Cancel",
		}).then((result) => {
			if (result.isConfirmed) {
				dispatch(logout());
				Swal.fire({
					title: "Logged out!",
					text: "You have been logged out successfully",
					icon: "success",
					timer: 1500,
				});
			}
		});
	};

	return (
		<div className="navbar bg-base-100 shadow-sm">
			<div className="navbar-start">
				<div className="dropdown">
					<div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
						</svg>
					</div>
					<ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
						<li>
							<Link to="/">Home</Link>
						</li>
						{isAuthenticated && (
							<li>
								<Link to="/game">Game</Link>
							</li>
						)}
					</ul>
				</div>
			</div>
			<div className="navbar-center">
				<Link to="/" className="btn btn-ghost text-xl">
					Compek Sekai
				</Link>
			</div>
			<div className="navbar-end">
				<ThemeSwitcher />
				{isAuthenticated ? (
					<div className="dropdown dropdown-end">
						<label tabIndex={0} className="btn btn-ghost btn-circle avatar">
							<div className="w-10 rounded-full bg-neutral text-neutral-content">
								<span>{user?.name?.charAt(0) || "U"}</span>
							</div>
						</label>
						<ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
							<li className="p-2 text-center font-bold">{user?.name}</li>
							<div className="divider my-0"></div>
							<li>
								<button onClick={handleLogout}>Logout</button>
							</li>
						</ul>
					</div>
				) : (
					<div className="flex gap-2">
						<Link to="/login" className="btn btn-ghost btn-circle">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</Link>
						<Link to="/register" className="btn btn-primary btn-circle">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
							</svg>
						</Link>
					</div>
				)}
			</div>
		</div>
	);
};

export default Navbar;
