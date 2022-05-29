import { String } from "lodash";

export class RequestGetList {
	apiKey: string;
	page: number;
}

export class RequestGetDetail {
	apiKey: string;
	id: number;
}

export class RequestSearch {
	apiKey: string;
	key: string;
}

export class ItemList {
	adult: boolean;
	backdropPath: string;
	id: number;
	originalLanguage: string;
	originalTitle: string;
	overview: string;
	popularity: number;
	posterPath: string;
	releaseDate: string;
	title: string;
	video: boolean;
	voteAverage: number;
	voteCount: number;

	constructor(data: any) {
		this.adult = data.adult;
		this.backdropPath = data.backdrop_path;
		this.id = data.id;
		this.originalLanguage = data.original_language;
		this.originalTitle = data.original_title;
		this.overview = data.overview;
		this.popularity = data.popularity;
		this.posterPath = data.poster_path;
		this.releaseDate = data.release_date;
		this.title = data.title;
		this.video = data.video;
		this.voteAverage = data.vote_average;
		this.voteCount = data.vote_count;
	}
}

export class DataList {
	page: number;
	data: ItemList[];
	totalPages: number;

	constructor(data?: any) {
		this.page = data.page;
		this.data = data.results.map((item: any) => new ItemList(item));
		this.totalPages = data.total_pages;
	}
}
