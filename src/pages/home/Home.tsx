import React from 'react';
import { makeStyles } from '@material-ui/core';
import {
	getMoreMovieLists,
	getMovieLists,
	searchMovie,
} from 'redux_management/home/slices';

import _ from 'lodash';
import { useAppDispatch, useAppSelector } from 'redux_management';
import MoreIcon from '@material-ui/icons/More';
import { useThrottle } from 'utils/throttle';
import MovieCard from 'components/movieCard/movieCard';
import CommonSearchBar from 'components/searchBarCustom/common_search_bar';
import CommonButton from 'components/buttonCustom/common_button';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { CommonLoadingSpinner } from 'components';
import { Detector } from 'react-detect-offline';

const useStyles = makeStyles(() => ({
	container: {
		// height: '100vh',
		display: 'flex',
		flexDirection: 'column',
		width: '100vw',
		position: 'relative',
		justifyContent: 'center',
		alignItems: 'center',
		'&::-webkit-scrollbar': {
			display: 'none',
			visibility: 'hidden',
		},
	},

	searchContainer: {
		flex: 1,
		paddingRight: 20,
	},

	listContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		display: 'grid',
		gridGap: 20,
		overflow: 'auto',
		scrollSnapType: 'x mandatory',
		scrollSnapStop: 'always',
		scrollPadding: '20px',
		padding: '0px 30px 8px',
		'&::-webkit-scrollbar': {
			display: 'none',
			visibility: 'hidden',
		},
	},

	body: {
		padding: '20px 200px 20px',
		width: '100%',
		// justifyContent: 'center',
		// alignItems: 'center',
		display: 'grid',
		overflow: 'auto',
	},
	loadMore: {
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	headerContainer: {
		// display: 'grid',
		display: 'flex',
		// gridTemplateColumns: 'repeat(auto-fill)',
		justifyContent: 'space_between',
		alignItems: 'center',
		background: '#032541',
		width: '100vw',
		paddingBottom: 20,
		color: 'white',
	},
	tabContainer: {
		// justifyContent: 'center',
		alignItems: 'center',
		paddingLeft: 20,
		paddingTop: 20,
		display: 'flex',
		flex: 1,
	},
	warning: {
		background: 'orange',
		width: '100vw',
		fontWeight: 700,
		textAlign: 'center',
		padding: 10,
	},
}));

const HomePage: React.FC = () => {
	const dispatch = useAppDispatch();
	const homeState = useAppSelector((state) => state.home);
	const { dataList } = homeState;
	const throttledSearch = useThrottle(
		(value: string) => handleSearch(value),
		1500,
	);
	const throttledLoadMore = useThrottle(() => {
		dispatch(getMoreMovieLists(homeState.page + 1));
		document
			.getElementById('list')
			?.scroll({ top: window.screen.height, behavior: 'smooth' });
	}, 1500);
	const handleSearch = (value: string) => {
		if (value.trim()) {
			// window.scrollTo(0, 0);
			dispatch(searchMovie(value));
		} else dispatch(getMovieLists(1));
	};

	const classes = useStyles();

	React.useEffect(() => {
		dispatch(getMovieLists(1));
	}, []);

	return (
		<div className={classes.container}>
			<Detector
				render={({ online }) =>
					!online && <div className={classes.warning}>You are currently offline</div>
				}
			/>
			{/* <CommonLoadingSpinner isLoading={homeState.isFetching} /> */}

			<div className={classes.headerContainer}>
				<div className={classes.tabContainer}>
					<CommonButton
						onClick={() => dispatch(getMovieLists(1))}
						title='Now Playing'
						height={45}
						width={150}
						backgroundColor='white'
					/>
					<div style={{ padding: 10 }} />
					<CommonButton
						title='Top Rated'
						height={45}
						width={150}
						backgroundColor='white'
					/>
				</div>

				<div className={classes.searchContainer}>
					<div>
						<h2>Khoa Nguyen Movies</h2>
					</div>
					<CommonSearchBar
						placeholder='Search for a movie ...'
						onSearch={throttledSearch}
					/>
				</div>
			</div>

			{!homeState.isFetching && _.isEmpty(dataList) && (
				<div>
					<h2>Not Found</h2>
				</div>
			)}
			{/* <PullToRefresh
				onRefresh={() => dispatch(getMovieLists(1))}
				// canFetchMore={true}
			>
			</PullToRefresh> */}
			<div className={classes.body} id='list'>
				<section
					className={classes.listContainer}
					style={{
						gridTemplateColumns: 'repeat(auto-fill, 200px)',
						// gridAutoFlow: 'column',
					}}
				>
					{dataList?.map((elm, index) => (
						<MovieCard key={elm.id} data={elm} />
					))}
				</section>

				<div className={classes.loadMore}>
					{!_.isEmpty(dataList) && (
						<CommonButton
							title='Load more'
							icon={<MoreIcon />}
							onClick={throttledLoadMore}
							height={60}
							width={250}
							backgroundColor='white'
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export default HomePage;
