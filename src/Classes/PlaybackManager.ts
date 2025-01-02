import { ChildProcess, spawn } from "child_process";
import { PassThrough } from "stream";
import { Song } from "./Playable/Song.js";
import { generalRadioBabble, llamaResponse } from "../lib/llamaResponse.js";
import path from "path";
import { loadQueueFromFile } from "../index.js";
import { io} from '../index.js';

const songFilePath = path.join(process.cwd(), 'songFiles.txt');
export class PlaybackManager {
	private currentProcess: ChildProcess | null = null;
	//js standard stream, outputs exactly what is passed in, immediately.
	private streamBuffer = new PassThrough();
	private currentSong: Song | null;
	private playedSongs: number = 0;
	constructor(private queue: Song[]) {
		process.on('SIGINT', () => {
			this.handleShutdown()
		})
		this.currentSong = null;
		this.playedSongs = 0;
	}

	private handleShutdown(): void {
		console.log('Shutting down...');
		if (this.currentProcess) {
			this.currentProcess.kill();
			console.log('FFmpeg process killed');
		}
		process.exit(0);
	}

	public async playNextSong() {

		if (this.currentProcess) {
			console.log('Playback already in progress..')
			return;
		}
		if (this.queue.length === 0) {
			console.log('Queue is empty. Reloading...');
			loadQueueFromFile(songFilePath);
			if (this.queue.length === 0) {
				console.error('No songs available to play.');
				return;
			}
		}

		const song = this.queue.shift();
		if (!song) {
			console.log('Queue is empty.')
			return
		} else {
			this.queue.map((song) => {
				console.log(`title: ${song.title}, artist: ${song.artist}, album: ${song.album}`)
			})

		}

		console.log(`Streaming file: ${song.filePath}`);
		this.currentSong = song;
		io.emit('currentSong', this.currentSongMetadata())

		if (song.filePath !== 'piperOutput.mp3' && song && song.filePath !== 'piperOutput.mp3') {
			this.playedSongs++
		}

		if (song?.filePath !== 'piperOutput.mp3' && this.queue[0] && this.queue[0].filePath !== 'piperOutput.mp3' && this.playedSongs == 4) {
			generalRadioBabble();
			this.queue.unshift(new Song('piperOutput.mp3'));
			this.playedSongs = 0
		}
		else if (song?.filePath !== 'piperOutput.mp3' && this.queue[0] && this.queue[0].filePath !== 'piperOutput.mp3' && this.playedSongs == 1) {
			llamaResponse(this.queue[0].returnMetadata());
			this.queue.unshift(new Song('piperOutput.mp3'));
		}
		this.currentProcess = spawn('ffmpeg', [
			'-re', // Real-time input
			'-i', song.filePath, // Input file
			'-vn',
			'-acodec', 'libmp3lame', // Ensure MP3 encoding
			'-b:a', '192k', // Set audio bitrate
			'-f', 'mp3', // Output format
			'pipe:1', // Output to stdout
		]);

		this.currentProcess?.stdout?.pipe(this.streamBuffer, { end: false })

		this.currentProcess?.stderr?.on('data', (data) => {
			// console.error(`FFmpeg stderr: ${data}`)
		})

		this.currentProcess?.on('close', (code) => {
			console.log(`Stream completed: ${code}`)
			this.currentProcess = null;
			this.playNextSong();
		})
	}

	public getStreamBuffer() {
		return this.streamBuffer;
	}
	public addSong(song: Song): void {
		this.queue.unshift(song);
	}
	public currentSongMetadata() {
		return this.currentSong?.returnMetadata();
	}
	public returnPlayedSongs() {
		return this.playedSongs;
	}
	public skipSong(){
		this.currentProcess = null;
		this.playNextSong();

	}
}
