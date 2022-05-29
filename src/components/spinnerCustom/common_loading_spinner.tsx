import React from 'react';
import { connect } from 'react-redux';
import './spinner.css';

type Props = {
	isLoading: boolean;
};

export const CommonLoadingSpinner: React.FC<Props> = ({ isLoading }) => {
	if (!isLoading) return null;

	return (
		<div className='spinner'>
			<div className='outer'>
				<div className='lds-dual-ring' />
			</div>
		</div>
	);
};
