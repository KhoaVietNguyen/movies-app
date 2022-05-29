import axios, { AxiosRequestConfig } from 'axios';

import { apiEndpointBaseUrl } from 'environments/environment';

import { isJwtTokenExpired } from 'utils/jwt-token';

const axiosWithAuthGuard = axios.create({
	baseURL: apiEndpointBaseUrl,
	timeout: 30000,
	headers: {
		'X-Custom-Header-With-Auth': 'foobar',
	},
});

const axiosWithoutAuthGuard = axios.create({
	baseURL: apiEndpointBaseUrl,
	timeout: 30000,
	headers: {
		// 'Access-Control-Allow-Origin': '*',
		// 'Access-Control-Allow-Credentials': 'true',
		// 'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS,POST,PUT',
		// 'Access-Control-Allow-Headers':
		// 	'Origin, X-Requested-With, Content-Type, Accept, Authorization',
	},
});

axiosWithAuthGuard.interceptors.request.use(
	async (config: AxiosRequestConfig) => {
		// Do thing like attach auth token header here
		// EG:
		let jwtToken: string = localStorage.getItem('jwtToken') || '';

		if (isJwtTokenExpired()) {
			const refreshToken = localStorage.getItem('refreshToken');

			try {
				const refreshTokenResponse: any = await axiosWithoutAuthGuard.post(
					`/Authenticate/refreshToken/${refreshToken}`,
				);
				jwtToken = refreshTokenResponse.token;

				localStorage.setItem('jwtToken', jwtToken);
			} catch (e) {
				// do something
			}
		}

		if (jwtToken) {
			config.headers.Authorization = `Bearer ${jwtToken}`;
		}

		return config;
	},
	(error: any) => Promise.reject(error),
);

export { axiosWithAuthGuard, axiosWithoutAuthGuard };
