import * as os from 'os';
import { exec } from 'child_process';

const monoExe = 'mono';
const wineExe = ['arm64', 'x64'].includes(process.arch) ? 'wine64' : 'wine';

console.log(process.arch)

function checkIfCommandExists(command) {
  const checkCommand = os.platform() === 'win32' ? 'where' : 'which';
  return new Promise((resolve) => {
    exec(`${checkCommand} ${command}`, (error) => {
      resolve(error ? false : true);
    });
  });
}

const [hasWine, hasMono] = await Promise.all([
    checkIfCommandExists(wineExe),
    checkIfCommandExists(monoExe)
]);

if (!hasWine || !hasMono) {
    throw new Error('You must install both Mono and Wine on non-Windows');
} else {
    console.log('All win32 dependencies OK!')
}