import { useRef, useEffect } from 'react';

const useDidMountRef = (): Boolean => {
	const didMountRef = useRef(false);

	useEffect(() => {
		if (!didMountRef.current) didMountRef.current = true;
	}, []);

	return didMountRef.current;
};

export default useDidMountRef;
