import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const initialState = {
	isLoading: false,
	language: 'en',
	tabIndex: 0,
};

const appSlice = createSlice({
	name: 'app',
	initialState,
	reducers: {
		toggleGlobalLoading: (state, action: PayloadAction<boolean>) => {
			state.isLoading = action.payload;
		},
	},
});
export const indexState = (state: { app: any }) => state.app.tabIndex;

export const { toggleGlobalLoading } = appSlice.actions;

export default appSlice.reducer;
