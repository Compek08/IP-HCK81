import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/axios';
import Swal from 'sweetalert2';

// Utility function for handling errors
const handleError = (error, defaultMessage) => error.response?.data || { error: defaultMessage };

// Utility function for showing Swal notifications
const showNotification = (type, title, text, timer = 1500) => {
    Swal.fire({ icon: type, title, text, timer });
};

// Async thunks
export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
    try {
        const response = await api.post('/auth/register', userData);
        localStorage.setItem('token', response.data.token);
        return response.data;
    } catch (error) {
        return rejectWithValue(handleError(error, 'Registration failed'));
    }
});

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
    try {
        const response = await api.post('/auth/login', credentials);
        localStorage.setItem('token', response.data.token);
        return response.data;
    } catch (error) {
        return rejectWithValue(handleError(error, 'Login failed'));
    }
});

export const googleLogin = createAsyncThunk('auth/googleLogin', async (idToken, { rejectWithValue }) => {
    try {
        const response = await api.post('/auth/google', { idToken });
        localStorage.setItem('token', response.data.token);
        return response.data;
    } catch (error) {
        console.error('Error during Google login:', error);
        return rejectWithValue(handleError(error, 'Google login failed'));
    }
});

export const verifyToken = createAsyncThunk('auth/verify', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get('/auth/verify');
        return response.data;
    } catch (error) {
        localStorage.removeItem('token');
        return rejectWithValue(handleError(error, 'Token verification failed'));
    }
});

const initialState = {
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: false,
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout(state) {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
        },
        clearError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
                showNotification('success', 'Welcome!', 'Registration successful');
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.error || 'Registration failed';
                showNotification('error', 'Registration Failed', state.error);
            })
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
                showNotification('success', 'Welcome back!', 'Login successful');
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.error || 'Login failed';
                showNotification('error', 'Login Failed', state.error);
            })
            .addCase(googleLogin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(googleLogin.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
                showNotification('success', 'Welcome!', action.payload.message);
            })
            .addCase(googleLogin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.error || 'Google login failed';
                showNotification('error', 'Google Login Failed', state.error);
            })
            .addCase(verifyToken.pending, (state) => {
                state.loading = true;
            })
            .addCase(verifyToken.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
            })
            .addCase(verifyToken.rejected, (state) => {
                state.loading = false;
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
            });
    },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;