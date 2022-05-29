import { ItemList } from "models/homeModels";



export const createLocalHistory = () => {
	if (!localStorage.getItem('history')) {
		const data: ItemList[] = [];
		localStorage.setItem('history', JSON.stringify({ data: data }));
	}
};

export const getLocalHistory = () => {
	return JSON.parse(localStorage.getItem('history') || '{}');
};

export const addToLocalHistory = (item: ItemList) => {
	if (localStorage.getItem('history')) {
		const historyData = JSON.parse(localStorage.getItem('history') || '{}');
		const itemCheck = historyData?.data?.find(
			(historyItem: ItemList) => historyItem.id === item.id,
		);
		if (!itemCheck) historyData?.data.push(item);
		localStorage.setItem('history', JSON.stringify({ data: historyData?.data }));
	}
};

export const deleteToLocalHistory = (id: any) => {
	const historyData = JSON.parse(localStorage.getItem('history') || '{}');
	const itemCheck = historyData?.data?.filter(
		(historyItem: ItemList) => historyItem.id !== id,
	);
	localStorage.setItem('history', JSON.stringify({ data: itemCheck }));
};

export const deleteAllLocalHistory = () => {
	localStorage.setItem('history', JSON.stringify({ data: [] }));
};
