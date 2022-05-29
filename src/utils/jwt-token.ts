import jwtDecode from 'jwt-decode';

export const isJwtTokenExpired = (): Boolean => {
	const jwtToken = localStorage.getItem('jwtToken') || '';

	if (!jwtToken) return true;

	const decoded: any = jwtDecode(jwtToken);
	return decoded.exp * 1000 < new Date().getTime();
};
