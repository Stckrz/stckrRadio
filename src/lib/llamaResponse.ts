import path from "path";
import { writeToFile } from "./writeFile.js";
import { exec } from 'child_process';
import { babblePrompt, nextSongPrompt } from "../Prompts/radioPrompts.js";

const stuffFile = path.join(process.cwd(), 'src/assets/stuff.txt')
export const generalRadioBabble = async () => {
	const body = {
		// model: "tinyllama:latest",
		model: "llama3.2",
		prompt: babblePrompt
	}
	try {
		const response = await fetch('http://ollama:11434/api/generate', {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		})
		const reader = response?.body?.getReader();
		const decoder = new TextDecoder("utf-8");
		let result = "";

		while (true) {
			if (reader) {
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
		}
		console.log(result)
		writeToFile(result, stuffFile)
		createWavFromText();
		return (result)
	}
	catch (error) {
		console.error("Error in llamaResponse:", error);
		throw error; // Re-throw to allow calling function to handle it
	}

}
export const llamaResponse = async (metadata: any) => {
	const prompt = nextSongPrompt(metadata);
	const body = {
		// model: "tinyllama:latest",
		model: "llama3.2",
		prompt: prompt,
	}
	try {
		const response = await fetch('http://ollama:11434/api/generate', {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		})
		const reader = response?.body?.getReader();
		const decoder = new TextDecoder("utf-8");
		let result = "";

		while (true) {
			if (reader) {
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
		}
		console.log(result)
		writeToFile(result, stuffFile)
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
	const inputFile = stuffFile
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
