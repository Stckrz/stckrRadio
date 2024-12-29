import express from 'express';
import http from 'http';
import fs from 'fs';
import cors from 'cors';
import * as dotenv from 'dotenv';
import path from 'path';
import { shuffle } from './lib/commonStuff.js';
import { getSubDirectoriesToWrite } from './lib/writeFile.js';
import { Song } from './Classes/Playable/Song.js';
import { PlaybackManager } from './Classes/PlaybackManager.js';
import { Server as SocketIOServer } from 'socket.io'; // Import Socket.IO

dotenv.config()
const app = express();
app.use(cors())

const PORT = process.env.NODE_PORT

const server = http.createServer(app);
const io = new SocketIOServer(server, {
	cors: {
		origin: '*', // Allow all origins, or specify your frontend's URL
		methods: ['GET', 'POST'],
	},
});
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
const returnDirectoryContents = (filePath: string) => {
	try {

		if (!fs.existsSync(filePath)) {
			console.log("directory does not exist", filePath);
			return
		}
		if (filePath === './audio') {
			// fs.writeFileSync(outputFile, '', 'utf8');
		}

		const files = fs.readdirSync(filePath, { withFileTypes: true });
		const directories = files.filter((file) => file.isDirectory())
		const mp3Files = files.filter((file) => file.name.endsWith('mp3'))

		return ({ directories: directories, files: mp3Files })
		// directories.forEach((subdirectory) => {
		// 	const subDirectoryPath = `${filePath}/${subdirectory.name}`
		// })
	}
	catch (err) {
		if (err instanceof Error) {
			console.log('Error reading directories', err.message)
		}
	}

}

const songFilePath = path.join(process.cwd(), 'songFiles.txt');
//function that adds the songs to the songFile
getSubDirectoriesToWrite()

const playbackManager = new PlaybackManager(queue);

(async () => {
	await loadQueueFromFile(songFilePath); // Load initial songs
	playbackManager.playNextSong();       // Start playback
})();
// res.setHeader('Access-Control-Allow-Origin', '*');
//    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
//    res.setHeader('Content-Type', 'audio/mpeg');
//on connect, streams the piped audio to the req. with headers
app.get('/stream', cors(), (req, res) => {
	res.writeHead(200, {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Allow-Methods': 'GET, OPTIONS',

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
		console.log('Client disconnected');
	})
})
app.get('/skip', (req, res) => {
	playbackManager.skipSong();
	res.json({ response: "skipping song" })

})

app.get('/metadata', cors(), (req, res) => {
	res.json(playbackManager.currentSongMetadata());
});

io.on('connection', (socket) => {
	console.log("a user connected!", socket.id);
	socket.emit('currentSong', playbackManager.currentSongMetadata())

	socket.on('currentSong', () => {
		socket.emit('currentSong', playbackManager.currentSongMetadata())
	})

	socket.on('listContents', (data, callback) => {
		const filePath = data.filePath
		const directoryContents = returnDirectoryContents(filePath)
		callback(directoryContents)
		// socket.emit('directoryList', returnDirectoryContents(filePath));
	})

	socket.on('addSong', (data) => {
		console.log("filepath", data.filePath)
		const songPath = data.songPath
		if (songPath) {
			queue.push(new Song(songPath))
		}
	})

	socket.on('disconnect', () => {
		console.log("a user disconnected!", socket.id)
	})
})

server.listen(3000, '0.0.0.0', () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
