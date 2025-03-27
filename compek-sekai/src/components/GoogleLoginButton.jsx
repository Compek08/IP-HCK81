import React, { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { googleLogin } from "../redux/slices/authSlice";

const GoogleLoginButton = () => {
	const dispatch = useDispatch();
	const googleScriptRef = useRef(null);

	useEffect(() => {
		// Load the Google API script
		const script = document.createElement("script");
		script.src = "https://accounts.google.com/gsi/client";
		script.async = true;
		script.defer = true;
		googleScriptRef.current = script;

		// Define callback function for Google
		window.handleCredentialResponse = (response) => {
			if (response.credential) {
				dispatch(googleLogin(response.credential));
			}
		};

		document.body.appendChild(script);

		return () => {
			// Safer cleanup
			if (googleScriptRef.current && document.body.contains(googleScriptRef.current)) {
				document.body.removeChild(googleScriptRef.current);
			}
			delete window.handleCredentialResponse;
		};
	}, [dispatch]);

	return (
		<div className="flex justify-center">
			<div id="g_id_onload" data-client_id={import.meta.env.VITE_GOOGLE_CLIENT_ID} data-callback="handleCredentialResponse" data-auto_prompt="false" data-cancel_on_tap_outside="true"></div>
			<div className="g_id_signin" data-type="standard" data-size="large" data-theme="outline" data-text="sign_in_with" data-shape="rectangular" data-logo_alignment="left"></div>
		</div>
	);
};

export default GoogleLoginButton;
