import React from 'react';
import classNames from 'classnames';
import {
	FormControl,
	FormHelperText,
	IconButton,
	InputAdornment,
	InputBase,
	makeStyles,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

type InputProps = {
	id?: string;
	title?: string;
	name?: string;
	placeholder?: string;
	row?: number;
	iconLeft?: any;
	onChangeText: (value: any) => void;
	initialValue?: string | number;
	textValidate?: string;
	maxLength?: number;
	error?: boolean;
	type?: 'number' | 'text';
};

const useStyles = makeStyles(() => ({
	root: {
		border: '1px solid var(--color-border)',
		fontSize: 15,
		borderRadius: 8,
		backgroundColor: 'var(--color-input)',
		color: 'var(--color-text)',
		height: (props: { row: number }) => props.row <= 1 && 36,
		padding: 10,
	},
	borderInput: {
		border: '1px solid red',
	},
	title: {
		fontSize: 14,
		fontWeight: 700,
		color: 'var(--color-text)',
		marginBottom: 6,
	},
	form: {
		width: '100%',
	},
}));

const CommonInput: React.FC<InputProps> = ({
	name,
	placeholder,
	row = 1,
	title,
	onChangeText,
	iconLeft,
	textValidate,
	initialValue,
	maxLength,
	type = 'text',
}) => {
	const [value, setValue] = React.useState(initialValue);
	const [isError, setError] = React.useState(false);

	const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
		setValue(event.target.value as string);
		onChangeText(event.target.value);
	};

	const handleBlur = () => {
		return setError(textValidate?.length > 0);
	};
	const clearText = () => {
		setValue('');
		onChangeText('');
		// if (textValidate?.length > 0) setError(true);
	};

	const classes = useStyles({ row });

	const endAdornment = () => {
		if (value) {
			return (
				<IconButton size='small' component='span' onClick={clearText}>
					<CloseIcon fontSize='inherit' />
				</IconButton>
			);
		}
		return '';
	};
	return (
		<>
			<FormControl
				error={textValidate?.length > 0}
				variant='standard'
				className={classes.form}
			>
				{title && <label className={classes.title}>{title}</label>}
				<InputBase
					inputProps={{ maxLength: maxLength, type: type }}
					name={name}
					startAdornment={
						iconLeft && <InputAdornment position='start'>{iconLeft}</InputAdornment>
					}
					endAdornment={endAdornment()}
					fullWidth
					rows={row}
					multiline={row > 1}
					value={value || ''}
					onChange={handleChange}
					className={classNames(classes.root, isError && classes.borderInput)}
					onBlur={handleBlur}
					placeholder={placeholder}
				/>
				{textValidate && (
					<FormHelperText id='component-error-text'>{textValidate}</FormHelperText>
				)}
			</FormControl>
		</>
	);
};

CommonInput.propTypes = {};

CommonInput.defaultProps = {
	// error: true,
};

export default CommonInput;
