import axios from 'axios';
import Swal from 'sweetalert2';

export const api = axios.create({ baseURL: "http://localhost:3000/api" });

// Add request interceptor to include auth token and show loading
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${ token }`;
        }

        // Show Swal loading
        Swal.fire({
            title: 'Processing...',
            text: 'Please wait while we process your request.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        return config;
    },
    (error) => {
        Swal.close(); // Close Swal if there's an error
        return Promise.reject(error);
    }
);

// Add response interceptor to close Swal after response
api.interceptors.response.use(
    (response) => {
        Swal.close(); // Close Swal on success
        return response;
    },
    (error) => {
        Swal.close(); // Close Swal on error
        return Promise.reject(error);
    }
);