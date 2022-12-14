import path from 'path';

import fs from 'fs-extra';

import { exec, fixRelativePath, ScriptDirname, TmpFileExt } from '../utils.js';
import Config from '../config.js';

const ignoreEndings = [
	'.exe',
	'.dll',
	'.db',
	'.csv',
	'.png',
	'.psd',
	'.txt',
	'.md',
	'.git',
	'.gitignore'
];

const loopFilesRecursive = (
	dirName: string,
	callback: (pathName: string) => boolean
) => {
	fs.readdirSync(dirName).forEach(f => {
		const fullPath = path.join(dirName, f);
		if (callback(fullPath)) return;
		if (fs.statSync(fullPath).isDirectory())
			loopFilesRecursive(fullPath, callback);
	});
};

const buildMpq = async (
	sourceDir = Config('PatchPath'),
	outputPath = `${Config('ClientPath')}/Data/${Config('PatchName')}`,
	inPlace?: unknown
) => {
	if (!outputPath?.endsWith('.mpq'))
		throw 'Please provide a valid destination.';

	console.log(`Building mpq from directory ${sourceDir}...`);
	const TmpPatchPath = inPlace
		? sourceDir
		: `${Config('PatchPath')}/../patch${TmpFileExt}`;

	!inPlace &&
		fs.copySync(sourceDir, `${Config('PatchPath')}/../patch${TmpFileExt}`);

	try {
		loopFilesRecursive(TmpPatchPath, f => {
			if (ignoreEndings.some(e => f.endsWith(e))) {
				fs.removeSync(f);
				return true;
			}
			return false;
		});

		await exec(
			`mpqtool.exe new "${fixRelativePath(TmpPatchPath)}" "${fixRelativePath(
				outputPath
			)}"`,
			{ cwd: `${ScriptDirname}/scripts` }
		);
		console.log(`Created mpq archive at ${outputPath}`);
	} finally {
		fs.removeSync(`${Config('PatchPath')}/../patch${TmpFileExt}`);
	}
};

export default buildMpq;
