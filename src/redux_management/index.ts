import appReducer from 'redux_management/app/slices';
import { combineReducers } from 'redux';
import { createBrowserHistory } from 'history';
import { configureStore, createReducer } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import homeReducer from 'redux_management/home/slices';

export const history = createBrowserHistory();

export const rootReducer = combineReducers({
	app: appReducer,
	home: homeReducer,
});

const store = configureStore({
	reducer: rootReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false,
		}),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
