import React from 'react';
import _ from 'lodash';

export function useThrottle(cb: any, delay: number) {
	const options = { leading: true, trailing: false }; // add custom lodash options
	const cbRef = React.useRef(cb);
	// use mutable ref to make useCallback/throttle not depend on `cb` dep
	React.useEffect(() => {
		cbRef.current = cb;
	});
	return React.useCallback(
		_.throttle((...args) => cbRef.current(...args), delay, options),
		[delay],
	);
}
