import moment from 'moment';
import { defaultDatetimeFormat } from 'environments/environment';

const formatDateTime = (
	value: string,
	format: string = defaultDatetimeFormat,
) => moment(value).format(format);

export default formatDateTime;
