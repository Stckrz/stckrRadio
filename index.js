import { writeMp3FilesToFile, getSubDirectoriesToWrite } from './lib/writeFile.js';
import express from 'express';
import fs from 'fs';
import { spawn } from 'child_process';
import { PassThrough } from 'stream';
import { parseFile } from 'music-metadata';
import { llamaResponse } from './lib/llamaResponse.js';
import { shuffle } from './lib/commonStuff.js';

const app = express();
const PORT = 3000;
const TTS_FILE_PATH = '/home/stckrz/code/simpleAudioStream/piperOutput.mp3';
const queue = [];
let ffmpeg = null;
let currentMetadata = {};
let nextMetadata = {};

//js standard stream, outputs exactly what is passed in, immediately.
const streamBuffer = new PassThrough()
const loadQueueFromFile = (filePath) => {
	try {
		//reads the file in, and adds each filename to the queue
		const fileContent = fs.readFileSync(filePath, 'utf8');
		const files = fileContent.split('\n').map((line) => line.trim()).filter((line) => line);
		files.map((file) => {
			queue.push(`${file}`)
		})
		shuffle(queue)
	} catch (err) {
		console.error('Error reading file ${filePath}: ', err.message);
	}
};

// piperOutput.mp3
const streamFile = async () => {
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
	currentMetadata = parseMetadata(filePath)
	if (filePath !== TTS_FILE_PATH && nextSong && nextSong !== TTS_FILE_PATH) {
		nextMetadata = parseMetadata(nextSong)

		llamaResponse(nextMetadata)
		queue.unshift('/home/stckrz/code/simpleAudioStream/piperOutput.mp3')
	}
	// try {
	// 	const metadata = await parseFile(filePath)
	// 	currentMetadata = {
	// 		title: metadata.common.title || 'Unknown Title',
	// 		artist: metadata.common.artist || 'Unknown Artist',
	// 		album: metadata.common.album || 'Unknown Album',
	// 		duration: metadata.format.duration || 0
	// 	}
	// } catch (error) {
	// 	console.error('error fetching metadata..', error.message)
	// 	currentMetadata = {
	// 		title: 'Unknown Title',
	// 		artist: 'Unknown Artist',
	// 		album: 'Unknown Album',
	// 		duration: 0
	// 	}
	// }
	// if (filePath !== TTS_FILE_PATH && nextSong && nextSong !== TTS_FILE_PATH) {
	// 	try {
	// 		const metadata2 = await parseFile(nextSong)
	// 		nextMetadata = {
	// 			title: metadata2.common.title || 'Unknown Title',
	// 			artist: metadata2.common.artist || 'Unknown Artist',
	// 			album: metadata2.common.album || 'Unknown Album',
	// 			duration: metadata2.format.duration || 0
	// 		}
	// 	} catch (error) {
	// 		console.error('error fetching metadata..', error.message)
	// 		nextMetadata = {
	// 			title: 'Unknown Title',
	// 			artist: 'Unknown Artist',
	// 			album: 'Unknown Album',
	// 			duration: 0
	// 		}
	//
	// 	}
	// 	llamaResponse(nextMetadata)
	// 	queue.unshift('/home/stckrz/code/simpleAudioStream/piperOutput.mp3')
	// }


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
		console.error(`FFmpeg stderr: ${data}`)
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
