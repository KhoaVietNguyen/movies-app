import {
	DataList,
	ItemList,
	RequestGetList,
	RequestSearch,
} from 'models/homeModels';
import { axiosWithAuthGuard, axiosWithoutAuthGuard } from 'utils/axios-client';



export async function getMovieLists(param: RequestGetList): Promise<any> {
	return await axiosWithoutAuthGuard
		.get(`/movie/now_playing?api_key=${param.apiKey}&page=${param.page}`)
		.then((res) => {
			let data = new DataList(res.data);
			return data;
		})
		.catch((err) => {
			alert('Server not responding');
			return;
		});
}

export async function searchMovie(param: RequestSearch): Promise<any> {
	return await axiosWithoutAuthGuard
		.get(`/search/movie?api_key=${param.apiKey}&query=${param.key}`)
		.then((res) => {
			console.log(res.data)
			let data = new DataList(res.data);
			return data;
		})
		.catch((err) => {
			alert('Server not responding');
			return;
		});
}
