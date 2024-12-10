import { getSubDirectoriesToWrite } from './lib/writeFile.js';
import express from 'express';
import fs from 'fs';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { PassThrough } from 'stream';
import { parseFile } from 'music-metadata';
import { generalRadioBabble, llamaResponse } from './lib/llamaResponse.js';
import { shuffle } from './lib/commonStuff.js';
dotenv.config()

const app = express();
const PORT = process.env.NODE_PORT
const queue = [];
let ffmpeg = null;
let currentMetadata = {};
let nextMetadata = {};
let playedSongs = 0;

//js standard stream, outputs exactly what is passed in, immediately.
const streamBuffer = new PassThrough()
const loadQueueFromFile = (filePath) => {
	try {
		//reads the file in, and adds each filename to the queue
		const fileContent = fs.readFileSync(filePath, 'utf8');
		const files = fileContent.split('\n').map((line) => line.trim()).filter((line) => line);
		for(let i = 0; i < 11; i++){
			shuffle(files);
			queue.push(`${files[i]}`);
		}
		console.error(queue)
		// files.map((file) => {
		// 	queue.push(`${file}`)
		// })
		shuffle(queue)
	} catch (err) {
		console.error('Error reading file ${filePath}: ', err.message);
	}
};

const parseMetadata = async (filePath) => {
	try {
		const metadata = await parseFile(filePath)
		return {
			title: metadata.common.title || 'Unknown Title',
			artist: metadata.common.artist || 'Unknown Artist',
			album: metadata.common.album || 'Unknown Album',
			duration: metadata.format.duration || 0
		}
	} catch (error) {
		return {
			title: 'Unknown Title',
			artist: 'Unknown Artist',
			album: 'Unknown Album',
			duration: 0
		}

	}
}

// piperOutput.mp3
const streamFile = async () => {
	console.error("played songs", playedSongs)
	console.error(queue)
	//if queue is empty, refills the queue
	if (queue.length === 0) {
		loadQueueFromFile('songFiles.txt');
		//if still empty, then queue is empty and cannot be refilled. returns.
		if (queue.length === 0) {
			ffmpeg = null;
			return;
		}
	}
	//pops off the first element in the queue to be played
	const filePath = queue.shift();
	const nextSong = queue[0];
	console.log(`Streaming file: ${filePath}`);
	if (filePath !== 'piperOutput.mp3' && nextSong && nextSong !== 'piperOutput.mp3') {
		playedSongs += 1
	}

	currentMetadata = await parseMetadata(filePath)
	if (filePath !== 'piperOutput.mp3' && nextSong && nextSong !== 'piperOutput.mp3' && playedSongs == 4) {
		generalRadioBabble();
		queue.unshift('piperOutput.mp3');
		playedSongs = 0
	}
	else if (filePath !== 'piperOutput.mp3' && nextSong && nextSong !== 'piperOutput.mp3' && playedSongs == 2) {
		nextMetadata = await parseMetadata(nextSong)

		llamaResponse(nextMetadata);
		queue.unshift('piperOutput.mp3');
	}


	// Start FFmpeg to continuously stream
	ffmpeg = spawn('ffmpeg', [
		'-re', // Real-time input
		'-i', filePath, // Input file
		'-vn',
		'-acodec', 'libmp3lame', // Ensure MP3 encoding
		'-b:a', '192k', // Set audio bitrate
		'-f', 'mp3', // Output format
		'pipe:1', // Output to stdout
	]);
	//literally, pipes the ffmpeg stdoutput through the passthrough
	ffmpeg.stdout.pipe(streamBuffer, { end: false })

	ffmpeg.stderr.on('data', (data) => {
		// console.error(`FFmpeg stderr: ${data}`)
	})

	ffmpeg.on('close', (code) => {
		console.log(`Stream completed: ${code}`)
		ffmpeg = null;
		streamFile()
	})
}

getSubDirectoriesToWrite()
streamFile();

//on connect, streams the piped audio to the req. with headers
app.get('/stream', (req, res) => {
	res.writeHead(200, {
		'Content-Type': 'audio/mpeg',
		'Transfer-Encoding': 'chunked',
		'Connection': 'keep-alive',
	});
	streamBuffer.pipe(res);
	req.on('open', () => {
		res.json({info: "user connected"})
	})
	//disconnects the stream from the user when they close the connection
	req.on('close', () => {
		streamBuffer.unpipe(res);
	})
})
app.get('/metadata', (req, res) => {
	res.json(currentMetadata);
});

app.get('/aiStuff', async (req, res) => {
	const stuff = await llamaResponse(currentMetadata)
	res.json(stuff);
});

app.listen(PORT, '0.0.0.0', () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
