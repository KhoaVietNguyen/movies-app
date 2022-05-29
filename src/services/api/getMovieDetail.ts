import { DataList, RequestGetDetail } from 'models/homeModels';
import { axiosWithoutAuthGuard } from 'utils/axios-client';

export async function getMovieDetail(param: RequestGetDetail): Promise<any> {
	return await axiosWithoutAuthGuard
		.get(`/movie/${param.id}?api_key=${param.apiKey}`)
		.then((res) => {
			let data = new DataList(res.data);
			return data;
		})
		.catch((err) => {
			alert('Server not responding');
			return;
		});
}
