import React from 'react';
import propsTypes from 'prop-types';
import { Badge, createStyles, makeStyles, withStyles } from '@material-ui/core';

type ButtonProps = {
	borderRadius?: number;
	height?: number;
	width?: number;
	onClick?: (value: any) => void;
	id?: string;
	title?: string;
	icon?:
		| string
		| React.ReactElement<any, string | React.JSXElementConstructor<any>>;
	isLeftIcon?: boolean;
	quantityBadge?: number;
	textColor?: string;
	backgroundColor?: string;
	isShadow?: boolean;
	isBorder?: boolean;
	disabled?: boolean;
	borderColor?: string;
};

const useStyles = makeStyles(() => ({
	root: (props: ButtonProps) => ({
		backgroundPosition: 'center',
		transition: 'background 0.8s',
		display: 'flex',
		alignItems: 'center',
		justifyContent: ' center',
		color: props.textColor,
		backgroundColor: props.backgroundColor,
		height: props.height,
		width: props.width, // || '100%',
		boxShadow: props.isShadow && '0px 4px 4px rgba(0, 0, 0, 0.25)',
		borderRadius: props.borderRadius,
		outline: 'none',
		border: props.isBorder ? `1px solid ${props.borderColor}` : 'none',
		'&:hover': {
			cursor: 'pointer',
			// boxShadow: '0 3px 5px rgb(0 0 0 / 0.8)',
			// background: `${props.backgroundColor} radial-gradient(circle, transparent 1%, ${props.backgroundColor} 1%) center/15000%`,
		},
		'&:focus': {},
		'&:visited': {},
		'&:active': {
			// backgroundColor: '#ffff',
			// backgroundSize: '100%',
			transition: 'background 0s',
			boxShadow: '0px 3px 3px rgb(0 0 0 / 0.8)',
		},
		'&:disabled': {
			opacity: 0.7,
			backgroundColor: '#A3A8B7',
			backgroundSize: '100%',
			transition: 'background 0s',
			outline: 'none',
		},
	}),
	title: {
		margin: 5,
		display: 'flex',
		flexGrow: 1,
		justifyContent: 'center',
		fontSize: 15,
		fontWeight: 700,
	},
}));

const StyledBadge = withStyles(() =>
	createStyles({
		badge: {
			left: 5,
			top: -15,
			fontSize: 8,
			// border: `2px solid white`,
		},
	}),
)(Badge);

const CommonButton: React.FC<ButtonProps> = ({
	borderRadius,
	height,
	width,
	id,
	onClick,
	title,
	icon,
	quantityBadge,
	textColor,
	backgroundColor,
	isShadow,
	isBorder,
	disabled = false,
	borderColor = '#fff',
}) => {
	const classes = useStyles({
		borderRadius,
		height,
		width,
		textColor,
		backgroundColor,
		isShadow,
		isBorder,
		borderColor,
	});

	
	return (
		<button
			className={classes.root}
			onClick={onClick}
			disabled={disabled}
		>
			<StyledBadge badgeContent={quantityBadge} color='error' />
			{typeof icon === 'string' ? <img src={icon} alt='' /> : icon}
			{title && <span className={classes.title}>{title}</span>}
		</button>
	);
};

CommonButton.propTypes = {
	onClick: propsTypes.func,
	title: propsTypes.string,
};

CommonButton.defaultProps = {
	isShadow: true,
	borderRadius: 8,
};

export default CommonButton;
