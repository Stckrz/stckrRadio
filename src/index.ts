import express from 'express';
import fs from 'fs';
import cors from 'cors';
import * as dotenv from 'dotenv';
import path from 'path';
import { shuffle } from './lib/commonStuff.js';
import { getSubDirectoriesToWrite } from './lib/writeFile.js';
import { Song } from './Classes/Playable/Song.js';
import { PlaybackManager } from './Classes/PlaybackManager.js';

dotenv.config()
const app = express();
app.use(cors())
const PORT = process.env.NODE_PORT
const queue: Song[] = [];
export const loadQueueFromFile = async (filePath: string) => {
	try {
		//reads the file in, and adds each filename to the queue
		const fileContent = fs.readFileSync(filePath, 'utf8');
		const files = fileContent.split('\n').map((line) => line.trim()).filter((line) => line);
		for (let i = 0; i < 11; i++) {
			shuffle(files);
			queue.push(new Song(`${files[i]}`))
		}
		console.error(queue)
		await Promise.all(queue.map((song) => song.loadMetadata()));
	} catch (err) {
		if (err instanceof Error) {
			console.error(`Error reading file ${filePath}: `, err.message);
		}
	}
};

const songFilePath = path.join(process.cwd(), 'songFiles.txt');
//function that adds the songs to the songFile
getSubDirectoriesToWrite()

const playbackManager = new PlaybackManager(queue);

(async () => {
	await loadQueueFromFile(songFilePath); // Load initial songs
	playbackManager.playNextSong();       // Start playback
})();

//on connect, streams the piped audio to the req. with headers
app.get('/stream', (req, res) => {
	res.writeHead(200, {
		'Content-Type': 'audio/mpeg',
		'Transfer-Encoding': 'chunked',
		'Connection': 'keep-alive',
	});
	playbackManager.getStreamBuffer().pipe(res);
	req.on('open', () => {
		res.json({ info: "user connected" })
	})
	//disconnects the stream from the user when they close the connection
	req.on('close', () => {
		playbackManager.getStreamBuffer().unpipe(res);
	})
})
app.get('/skip', (req, res) => {
	playbackManager.skipSong();
	res.json({ response: "skipping song" })

})

app.get('/metadata', cors(),(req, res) => {
	res.json(playbackManager.currentSongMetadata());
});

app.listen(3000, '0.0.0.0', () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
