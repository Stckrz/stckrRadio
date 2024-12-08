import { writeToFile } from "./writeFile.js";
import {exec} from 'child_process';

export const llamaResponse = async (metadata) => {
	const body = {
		model: "tinyllama:latest",
		prompt: `You are a radio host, presenting the next song, given this metadata: ${JSON.stringify(metadata)}. Do not mention the word "metadata" and do not discuss the "duration". .The name of the radio station is tinyllama. If the metadata is insufficient, just talk about the radio station. feel free to get creative. Keep the response on the shorter side`
	}
	try {
		const response = await fetch('http://localhost:11434/api/generate', {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		})
		const reader = response.body.getReader();
		const decoder = new TextDecoder("utf-8");
		let result = "";

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			const chunk = decoder.decode(value, { stream: true })
			const lines = chunk.split('\n').filter(line => line.trim())
			for (const line of lines) {
				try {
					const parsed = JSON.parse(line);
					if (parsed.response) {
						result += parsed.response;
					}
				} catch (error) {

					console.log(error)
				}
			}
		}
		console.log(result)
		writeToFile(result, './stuff.txt')
		createWavFromText();
		return (result)
	}
	catch (error) {
		console.error("Error in llamaResponse:", error);
		throw error; // Re-throw to allow calling function to handle it
	}
}
export const createWavFromText = () => {
	// const pythonPath = '../piper/piperenv/bin/python'; // Adjust to your venv location
	const pythonPath = '/home/stckrz/code/simpleAudioStream/piper/piperenv/bin/python'; // Adjust to your venv location
	// const scriptPath = '../piper/generate_tts.py'
	const scriptPath = '/home/stckrz/code/simpleAudioStream/piper/generate_tts.py'
	// const inputFile = '../stuff.txt'
	const inputFile = '/home/stckrz/code/simpleAudioStream/stuff.txt'
	const outputFile = 'ass.wav'

	// Construct the command
	const command = `${pythonPath} ${scriptPath} ${inputFile} ${outputFile}`;
	exec(command, (error, stdout, stderr) => {
		if (error) {
			console.error('Error executing Python script:', error);
			return reject(error);
		}
		if (stderr) {
			console.error('Python script stderr:', stderr);
		}
		console.log('Python script stdout:', stdout);
		// resolve(outputFile); // Resolve with the path to the output file
	});

}
