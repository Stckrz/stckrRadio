import fs from 'fs';
import path from 'path';
export const writeToFile = (text: string, outputFile: string) => {
	fs.writeFileSync(outputFile, text, 'utf8')
}

const audioPath = path.join(process.cwd(), 'src/assets/audio')
const songFilePath = path.join(process.cwd(), 'songFiles.txt')
export const getSubDirectoriesToWrite = (directory = audioPath, outputFile = songFilePath) => {
	try {
		if (!fs.existsSync(directory)) {
			console.log("directory does not exist", directory);
			return
		}
		if (directory === './audio') {
			fs.writeFileSync(outputFile, '', 'utf8');
		}

		const files = fs.readdirSync(directory, { withFileTypes: true });
		const directories = files.filter((file) => file.isDirectory())

		// writeMp3FilesToFile(directory, outputFile)
		writeMp3FilesToFile(directory)
		// const subFiles = fs.readdirSync(directory);
		// const mp3Files = subFiles.filter((file) => file.endsWith('.mp3'))
		// 	.map((file) => `${directory}/${file}`)
		// 	.map((file) => {
		// 		mp3FileArray.push(file);
		// 	})

		directories.forEach((subdirectory) => {
			const subDirectoryPath = `${directory}/${subdirectory.name}`
			getSubDirectoriesToWrite(subDirectoryPath, outputFile)
		})
	}
	catch (err) {
		if (err instanceof Error) {
			console.log('Error reading directories', err.message)
		}
	}
}

export const writeMp3FilesToFile = (directory: string, outputFile = 'songFiles.txt') => {
	try {
		if (!fs.existsSync(directory)) {
			console.log("directory does not exist", directory);
			return;
		}

		const files = fs.readdirSync(directory);
		const mp3Files = files.filter((file) => file.endsWith('.mp3'))
			.map((file) => `${directory}/${file}`);

		if (mp3Files.length === 0) {
			console.log(`No mp3 files found in ${directory}`);
			return;
		}

		fs.appendFileSync(outputFile, '\n', 'utf8');

		fs.appendFileSync(outputFile, mp3Files.join('\n'), 'utf8');
		console.log(`mp3 files written to ${outputFile}`)
	} catch (err) {
		if (err instanceof Error) {
			console.log('Error writing to file', err.message)
		}
	}
}
