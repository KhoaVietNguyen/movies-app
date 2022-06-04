import { API_KEY } from './../../constant/index';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { DataList, ItemList, RequestGetList } from 'models/homeModels';
import services from 'services';
import { delay } from 'utils/delay';

export const initialState = {
	page: 0,
	isFetching: false,
	isFetchingScan: false,
	dataList: [] as ItemList[],
	scanInfo: { statusCode: Number(), message: '', bookingId: '' },
};

export const getMovieLists = createAsyncThunk<{ dataList: DataList }, number>(
	'home/getMovieLists',
	async (page: number) => {
		const dataList = await services.api.getMovieLists({
			apiKey: API_KEY,
			page: page,
		});
		return {
			dataList,
		};
	},
);

export const getMoreMovieLists = createAsyncThunk<
	{ dataList: DataList },
	number
>('home/getMoreMovieLists', async (page: number) => {
	//  await delay(1000);
	const dataList = await services.api.getMovieLists({
		apiKey: API_KEY,
		page: page,
	});
	return {
		dataList,
	};
});

export const searchMovie = createAsyncThunk<{ dataList: DataList }, string>(
	'home/search',
	async (param?: string) => {
		// await delay(1000);
		const dataList = await services.api.searchMovie({
			apiKey: API_KEY,
			key: param,
		});
		return {
			dataList,
		};
	},
);

const homeSlice = createSlice({
	name: 'home',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(getMovieLists.pending, (state) => {
				state.isFetching = true;
				state.dataList = [];
			})
			.addCase(getMovieLists.fulfilled, (state, action) => {
				state.dataList = action.payload.dataList.data;
				state.page = action.payload.dataList.page;
				state.isFetching = false;
			})
			.addCase(getMovieLists.rejected, (state) => {
				state.isFetching = false;
			});
		builder
			.addCase(getMoreMovieLists.pending, (state) => {
				state.isFetching = true;
			})
			.addCase(getMoreMovieLists.fulfilled, (state, action) => {
				state.dataList = [...state.dataList, ...action.payload.dataList.data];
				state.page = action.payload.dataList.page;
				state.isFetching = false;
			})
			.addCase(getMoreMovieLists.rejected, (state) => {
				state.isFetching = false;
			});
		builder
			.addCase(searchMovie.pending, (state) => {
				state.isFetching = true;
				state.dataList = [];
			})
			.addCase(searchMovie.fulfilled, (state, action) => {
				state.dataList = action.payload.dataList.data;
				state.isFetching = false;
			})
			.addCase(searchMovie.rejected, (state) => {
				state.isFetching = false;
			});
	},
});

export default homeSlice.reducer;
