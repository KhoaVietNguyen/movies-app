import {
	Backdrop,
	CircularProgress,
	Dialog,
	makeStyles,
} from '@material-ui/core';
import { URL_IMAGE, URL_IMAGE_CARD } from 'constant';
import React from 'react';
import { ItemList } from 'models/homeModels';
import { formatDatetime } from 'utils';
import CommonButton from 'components/buttonCustom/common_button';
import CloseIcon from '@material-ui/icons/Close';
import BookmarkIcon from '@material-ui/icons/Bookmark';
import StartIcon from '@material-ui/icons/Star';
import MoreIcon from '@material-ui/icons/More';
import PlayIcon from '@material-ui/icons/PlayCircleFilled';
import ErrorIcon from '@material-ui/icons/ErrorOutline';
import SkeletonCard from './skeletonCard';
import Skeleton from '@material-ui/lab/Skeleton';
import { delay } from 'utils/delay';
import ImageCustom from './imageCustom';

type Props = {
	data: ItemList;
};

const useStyles = makeStyles(() => ({
	imageContainer: {
		borderRadius: 8,
		position: 'relative',
		backgroundSize: 'cover',
		backgroundRepeat: ' no-repeat',
		backgroundImage: (props: ItemList) =>
			`url(${URL_IMAGE}${props.posterPath}) ,linear-gradient(to bottom, grey 30%, white 100%)`,
		width: 200,
		height: 300,
	},
	cardContainer: {
		display: 'flex',
		flexDirection: 'column',
		height: '100%',
		background: 'var(--color-foreground)',
		boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
		borderRadius: 8,
		fontSize: 15,
		fontWeight: 700,
		scrollSnapAlign: 'start',
		// flexShrink: 0,
		'&:active': {
			boxShadow: '0px 4px 5px rgb(0 0 0 / 0.8)',
			fontSize: 18,
		},
		'&:hove': {
			fontSize: 18,
			boxShadow: '0px 4px 5px rgb(0 0 0 / 0.8)',
			background: '#f00',
		},
	},

	infoContainer: {
		padding: '20px 12px',
		color: 'var(--color-text)',
	},

	loadingContainer: {
		position: 'absolute',
		borderRadius: 8,
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		height: '100%',
		width: '100%',
	},
	date: {
		color: '#9CA0A7',
	},
	close: {
		position: 'absolute',
		padding: 10,
		right: 0,
	},
	dialog: {
		backgroundSize: 'cover',
		backgroundRepeat: ' no-repeat',
		backgroundImage: (props: ItemList) =>
			`url(${URL_IMAGE}${props.backdropPath})`,
	},
	dialogContainer: {
		borderRadius: 0,
		color: 'white',
		backgroundPosition: 'center -150px',
		backgroundSize: 'cover',
		backgroundRepeat: ' no-repeat',
		backgroundImage: (props: ItemList) =>
			`url(${URL_IMAGE}${props.backdropPath})`,
	},
	dialogContent: {
		borderRadius: 0,
		display: 'flex',
		flexDirection: 'row',
		height: '100%',
		backgroundImage:
			'linear-gradient(to right, rgba(10, 5, 10, 0.7) 100px, rgba(10, 10, 10.5, 0.8) 100%)',
	},
	content: {
		padding: 20,
	},
	imageDialog: {
		padding: '30px 20px 20px 50px',
	},
	buttonGroup: {
		display: 'flex',
		flexDirection: 'row',
		width: 150,
		justifyContent: 'space-between',
		paddingTop: 30,
		paddingBottom: 30,
	},
}));

const MovieCard: React.FC<Props> = ({ data }) => {
	const classes = useStyles(data);
	const [didLoad, setLoad] = React.useState(false);
	const [open, setOpen] = React.useState(false);
	const [isError, setError] = React.useState(false);
	const [url, setUrl] = React.useState(URL_IMAGE_CARD + data.posterPath);

	const handleClickOpen = () => {
		setOpen(true);
	};
	const handleClose = () => {
		setOpen(false);
	};

	return (
		<>
			<div className={classes.cardContainer} onClick={handleClickOpen}>
				<ImageCustom url={URL_IMAGE_CARD + data.posterPath} />

				<div className={classes.infoContainer}>
					<div>{data.title}</div>
					<div className={classes.date}>
						{formatDatetime(data.releaseDate, 'LL')}
					</div>
				</div>
			</div>
			<Dialog
				closeAfterTransition
				BackdropComponent={Backdrop}
				BackdropProps={{
					timeout: 2000,
				}}
				maxWidth='xl'
				fullWidth
				onClose={handleClose}
				open={open}
				className={classes.dialog}
				PaperProps={{
					style: { borderRadius: 0 }
				  }}
			>
				<div className={classes.dialogContainer}>
					<div className={classes.dialogContent}>
						<div className={classes.imageDialog}>
							<ImageCustom
								url={URL_IMAGE_CARD + data.posterPath}
								//height={450}
								//width={260}
							/>
						</div>
						<div className={classes.content}>
							<h1>
								{data.title} {formatDatetime(data.releaseDate, 'YYYY')}
							</h1>
							<div className={classes.date}>
								{formatDatetime(data.releaseDate, 'LL')}
							</div>
							<h3>Overview</h3>
							<div>{data.overview}</div>
							<div>
								<h3>Vote Average : {data.voteAverage} </h3>
							</div>
							<div>
								<h3>Vote Count : {data.voteCount} </h3>
							</div>
							<div className={classes.buttonGroup}>
								<CommonButton
									icon={<MoreIcon />}
									height={40}
									width={40}
									borderRadius={40}
									backgroundColor='white'
								/>
								<CommonButton
									borderRadius={40}
									icon={<BookmarkIcon />}
									height={40}
									width={40}
									backgroundColor='white'
								/>
								<CommonButton
									icon={<StartIcon />}
									height={40}
									width={40}
									borderRadius={40}
									backgroundColor='white'
								/>
							</div>

							<CommonButton
								title='PLAY TRAIlER'
								icon={<PlayIcon />}
								height={40}
								width={200}
								borderRadius={40}
								backgroundColor='white'
							/>
						</div>

						<div className={classes.close}>
							<CommonButton
								borderRadius={15}
								onClick={handleClose}
								icon={<CloseIcon />}
								height={40}
								width={40}
								backgroundColor='white'
							/>
						</div>
					</div>
				</div>
			</Dialog>
		</>
	);
};

export default MovieCard;
