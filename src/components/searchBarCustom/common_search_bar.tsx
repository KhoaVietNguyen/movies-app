import React from 'react';
import SearchIcon from '@material-ui/icons/Search';
import { makeStyles } from '@material-ui/styles';

import { AppBar } from '@material-ui/core';
import CommonInput from 'components/inputCustom/common_Input';
import CommonButton from 'components/buttonCustom/common_button';

type Props = {
	placeholder?: string;
	onChange?: (value: string) => void;
	onSearch?: (value: string) => void;
	initialValue?: string;
};

const useStyles = makeStyles(() => ({
	container: {
		display: 'flex',
		justifyContent: 'space-between',
		// alignItems: 'center',
	},
	appBar: {
		top: 55,
		backgroundColor: 'var(--color-background)',
		boxShadow: 'none',
		textAlign: 'center',
	},
}));

const CommonSearchBar: React.FC<Props> = ({
	placeholder,
	onSearch,
	initialValue,
	onChange,
}) => {
	const classes = useStyles();
	const [value, setValue] = React.useState('');
	const handleSearch = (value: string) => {
		setValue(value);
		onChange(value);
	};
	return (
		<AppBar position='sticky' className={classes.appBar}>
			<div className={classes.container}>
				<CommonInput
					initialValue={initialValue}
					onChangeText={handleSearch}
					placeholder={placeholder}
					error={false}
					row={1}
					onEnter = {() => onSearch(value)}
				/>
				<div style={{ padding: 5 }} />
				<CommonButton
					onClick={() => onSearch(value)}
					icon={<SearchIcon />}
					height={36}
					width={36}
					backgroundColor='white'
				/>
			</div>
		</AppBar>
	);
};

CommonSearchBar.defaultProps = {};

export default CommonSearchBar;
