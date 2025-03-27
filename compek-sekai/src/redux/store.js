import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import gameReducer from './slices/gameSlice';

// Add this middleware to enable dispatching from within action handlers
const asyncDispatchMiddleware = store => next => action => {
    let syncActivityFinished = false;
    let actionQueue = [];

    function flushQueue() {
        actionQueue.forEach(a => store.dispatch(a));
        actionQueue = [];
    }

    function asyncDispatch(asyncAction) {
        actionQueue = actionQueue.concat([asyncAction]);

        if (syncActivityFinished) {
            flushQueue();
        }
    }

    const result = next({ ...action, asyncDispatch });

    syncActivityFinished = true;
    flushQueue();

    return result;
};

export const store = configureStore({
    reducer: {
        auth: authReducer,
        game: gameReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(asyncDispatchMiddleware)
});