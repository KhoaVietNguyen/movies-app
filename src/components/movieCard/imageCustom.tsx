import { CircularProgress, makeStyles } from '@material-ui/core';
import React from 'react';
import ErrorIcon from '@material-ui/icons/ErrorOutline';
import { delay } from 'utils/delay';

type Props = {
	url: string;
	height?: number | string;
	width?: number | string;
	borderRadius?: number;
};

const useStyles = makeStyles(() => ({
	imageContainer: {
		borderRadius: (props: Props) => props.borderRadius,
		position: 'relative',
		backgroundSize: 'cover',
		backgroundRepeat: ' no-repeat',
		backgroundImage: (props: Props) =>
			`url(${props.url}) ,linear-gradient(to bottom, grey 30%, white 100%)`,
		width: (props: Props) => props.width,
		height: (props: Props) => props.height,
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
}));

const ImageCustom: React.FC<Props> = ({
	url,
	borderRadius = 8,
	height = 300,
	width = 200,
}) => {
	const classes = useStyles({ url, borderRadius, height, width });
	const [didLoad, setLoad] = React.useState(false);
	const [isError, setError] = React.useState(false);

	return (
		<div className={classes.imageContainer}>
			{!didLoad && (
				<div className={classes.loadingContainer}>
					<CircularProgress color='secondary' />
				</div>
			)}
			{isError && (
				<div className={classes.loadingContainer}>
					<ErrorIcon fontSize='large' />
				</div>
			)}

			<img
				hidden
				alt=''
				src={url}
				onLoad={async () => {
					await delay(1000);
					setLoad(true);
				}}
				onError={() => {
					setError(true);
				}}
				height={200}
			/>
		</div>
	);
};

export default ImageCustom;
