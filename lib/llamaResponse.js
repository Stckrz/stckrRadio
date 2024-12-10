import { writeToFile } from "./writeFile.js";
import { exec } from 'child_process';
export const generalRadioBabble = async () => {
	const body = {
		// model: "tinyllama:latest",
		model: "llama3.2",
		prompt: `You are a radio host broadcasting from a deep space station in a secluded corner of the galaxy. The space station's name is TinyLlama. Discuss events happening currently in the sector in space that you are located in, and make general discussion and smalltalk about the station. End by stating that more tunes are incoming. Avoid unneccessary stage direction like (background noise) or (music fades in).`
	}
	try {
		const response = await fetch('http://ollama:11434/api/generate', {
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
export const llamaResponse = async (metadata) => {
	const body = {
		// model: "tinyllama:latest",
		model: "llama3.2",
		prompt: `You are a radio host broadcasting from Deep Space Station TinyLlama, a lonely but lively outpost floating in the farthest reaches of the galaxy. your task is to introduce the next song using the provided metadat: ${JSON.stringify(metadata)}. keep the anouncement short and engaging, avoiding unneccesary stage direction like (background noise) or (music fades in). Focus on the artist, song, and a quick cosmic-themed remark to set the mood.` 
	}
	try {
		const response = await fetch('http://ollama:11434/api/generate', {
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
	const pythonPath = 'python3';
	const scriptPath = '/app/piper/generate_tts.py'
	const inputFile = 'stuff.txt'
	const outputFile = 'ass.wav'

	// Construct the command
	const command = `${pythonPath} ${scriptPath} ${inputFile} ${outputFile}`;
	exec(command, (error, stdout, stderr) => {
		if (error) {
			console.error('Error executing Python script:', error);
			return error;
		}
		if (stderr) {
			console.error('Python script stderr:', stderr);
		}
		console.log('Python script stdout:', stdout);
	});

}
