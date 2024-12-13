import { Playable } from "./Playable.js";
export interface Metadata{
	title: string,
	artist: string,
	album: string,
	duration: number,
}
export class Song extends Playable {
	title: string;
	artist: string;
	album: string;
	duration: number;
	constructor(
		filePath: string,
		title: string = 'Unknown Title',
		artist: string = 'Unknown Artist',
		album: string = 'Unknown Album',
		duration: number = 0
	) {
		super(filePath);
		this.title = title;
		this.artist = artist;
		this.album = album;
		this.duration = duration;
	}
	async loadMetadata(): Promise<void> {
		const { parseFile } = await import('music-metadata');
		try {
			const metadata = await parseFile(this.filePath);
			this.title = metadata.common.title || this.title;
			this.artist = metadata.common.artist || this.artist;
			this.album = metadata.common.album || this.album;
			this.duration = metadata.format.duration || this.duration;
			console.log("successfully fetched metadata")
		} catch (err) {
			console.error(`Error loading metadata for ${this.filePath}:`, err);
		}
	}
	returnMetadata(): Metadata{
		const metadataObject = {
			title: this.title,
			artist: this.artist,
			album: this.album,
			duration: this.duration,
		}
		return metadataObject
	}
}
