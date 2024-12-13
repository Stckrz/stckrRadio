export class SongQueue{
	fileList: string[];
	currentPosition: number;
	constructor(
		fileList: string[],
	){
		this.fileList = fileList;
		this.currentPosition = 0;
	}
}
