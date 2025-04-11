import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/axios';
import Swal from 'sweetalert2';

// Helper function for retry logic with Swal
const handleRetry = (errorMessage, retryAction, retryArgs) => {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        showCancelButton: true,
        confirmButtonText: 'Retry',
        cancelButtonText: 'Cancel',
    }).then((result) => {
        if (result.isConfirmed) {
            retryAction(retryArgs);
        }
    });
};

// Async thunks
export const initGame = createAsyncThunk(
    'game/init',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.post('/game/init');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { error: 'Failed to initialize game' });
        }
    }
);

// Add this new thunk to get all user's game sessions
export const getGameSessions = createAsyncThunk(
    'game/getSessions',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/game/sessions');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { error: 'Failed to get game sessions' });
        }
    }
);

export const getOptions = createAsyncThunk(
    'game/getOptions',
    async (sessionId, { rejectWithValue }) => {
        try {
            // Then get options
            const optionsResponse = await api.get(`/game/session/${ sessionId }/options`);

            // First, get dialogue history
            const historyResponse = await api.get(`/game/session/${ sessionId }/history`);
            console.log("Full Responses", optionsResponse);
            return {
                dialogueHistory: historyResponse.data.dialogueHistory,
                options: optionsResponse.data.options
            };
        } catch (error) {
            return rejectWithValue(error.response?.data || { error: 'Failed to get game data' });
        }
    }
);

export const selectOption = createAsyncThunk(
    'game/selectOption',
    async ({ sessionId, optionId, dialogue }, { rejectWithValue, dispatch }) => {
        try {
            const response = await api.post(`/game/session/${ sessionId }/select`, { optionId, dialogue });

            // After selecting an option, get new options and dialogue history
            dispatch(getOptions(sessionId));

            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { error: 'Failed to select option' });
        }
    }
);

export const getPlayerStatus = createAsyncThunk(
    'game/getPlayerStatus',
    async (sessionId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/game/session/${ sessionId }/status`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { error: 'Failed to get player status' });
        }
    }
);

const initialState = {
    sessionId: null,
    options: [],
    dialogueHistory: [],
    loading: false,
    error: null,
    currentScene: null,
    sessions: [] // Add this to store user's game sessions
};

const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        resetGame(state) {
            return initialState;
        },
        clearGameError(state) {
            state.error = null;
        },
        setSessionId(state, action) {
            state.sessionId = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            // Init Game
            .addCase(initGame.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(initGame.fulfilled, (state, action) => {
                state.loading = false;
                state.sessionId = action.payload.sessionId;
                state.currentScene = 'starting_village';
                Swal.fire({
                    icon: 'success',
                    title: 'Game Started',
                    text: 'Welcome to Compek Sekai!',
                    timer: 1500
                });
            })
            .addCase(initGame.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.error || 'Failed to initialize game';
                Swal.fire({
                    icon: 'error',
                    title: 'Game Initialization Failed',
                    text: state.error
                });
            })

            // Get Options
            .addCase(getOptions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getOptions.fulfilled, (state, action) => {
                state.loading = false;
                state.options = action.payload.options;
                if (action.payload.dialogueHistory) {
                    state.dialogueHistory = action.payload.dialogueHistory;
                }
            })
            .addCase(getOptions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.error || 'Failed to get options';

                // Store the original sessionId for retry
                const sessionId = action.meta.arg;

                handleRetry(state.error, getOptions, sessionId);
            })

            // Select Option
            .addCase(selectOption.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(selectOption.fulfilled, (state) => {
                state.loading = false;
                // The dialogue history will be updated by getOptions which is called after selection
            })
            .addCase(selectOption.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.error || 'Failed to select option';

                // Store the original parameters for retry
                const originalParams = action.meta.arg;

                handleRetry(state.error, selectOption, originalParams);
            })

            // Get Player Status
            .addCase(getPlayerStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getPlayerStatus.fulfilled, (state, action) => {
                state.loading = false;
                state.playerStatus = action.payload;
            })
            .addCase(getPlayerStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.error || 'Failed to get player status';
            })

            // Add the new case handlers for getGameSessions
            .addCase(getGameSessions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getGameSessions.fulfilled, (state, action) => {
                state.loading = false;
                state.sessions = action.payload.sessions || [];
            })
            .addCase(getGameSessions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.error || 'Failed to get game sessions';

                handleRetry(state.error, getGameSessions);
            });
    }
});

export const { resetGame, clearGameError, setSessionId } = gameSlice.actions;
export default gameSlice.reducer;