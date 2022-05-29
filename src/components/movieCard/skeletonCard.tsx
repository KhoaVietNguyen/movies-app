import { makeStyles } from '@material-ui/core';
import React from 'react';
import Skeleton from '@material-ui/lab/Skeleton';

const useStyles = makeStyles(() => ({
	cardContainer: {
		// boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
		// borderRadius: 8,
	},

	infoContainer: {
		flex: 1,
		padding: '20px 12px',
		color: 'var(--color-text)',
	},
}));

const SkeletonCard: React.FC = () => {
	const classes = useStyles({});

	return (
		<div className={classes.cardContainer}>
			<Skeleton height={300} animation='wave' />

			<div className={classes.infoContainer}>
				<Skeleton width={210} height={30} animation='wave' />
				<Skeleton width={210} height={30} animation='wave' />
			</div>
		</div>
	);
};

export default SkeletonCard;
