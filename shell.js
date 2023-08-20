const EventEmitter = require('events');
const {logs} = require('xeue-logs');
const {exec} = require('child_process');

class Shell {
	constructor(
		logger = logs,
        logsText = 'SHELL',
        logsLevel = 'C',
        shell
	) {
		this.logger = logger;
        this.logsText = logsText;
        this.logsLevel = logsLevel;
        if (shell) this.shell = shell;
	}

    run(command, doPrint = true) {
        const commandEventEmitter = new EventEmitter();

        const commandOutput = new Promise((resolve, reject) => {
            const stdout = [];
            const stderr = [];
            let hasErrors = false;
            const shellOptions = {};
            if (this.shell) shellOptions.shell = this.shell
            const proc = exec(command, shellOptions);
            proc.stdout.on('data', data => {
                const output = data.trim();
                stdout.push(output);

                commandEventEmitter.emit('stdout', output);

                if (output != "" && doPrint) this.logger.log(output, [this.logsLevel, this.logsText, logs.p])
            });
            proc.stderr.on('data', data => {
                const output = data.trim();
                stderr.push(output);
                hasErrors = true;

                commandEventEmitter.emit('stderr', output);

                if (output != "" && doPrint) this.logger.log(output, [this.logsLevel, this.logsText, logs.r])
            });
            proc.on('exit', () => {
                const output = {
                    "stdout":stdout,
                    "stderr":stderr,
                    "hasErrors":hasErrors,
                    "execProcess":proc
                }
                commandEventEmitter.emit('exit', output);
                resolve(output)
            });
            proc.on('error', error => {
                commandEventEmitter.emit('error', error);
                reject(error)
            });
        });

        commandOutput.stdout = func => {commandEventEmitter.on('stdout', func)};
        commandOutput.stderr = func => {commandEventEmitter.on('stderr', func)};
        commandOutput.error = func => {commandEventEmitter.on('error', func)};
        commandOutput.exit = func => {commandEventEmitter.on('exit', func)};
        return commandOutput;
    }
}

module.exports.Shell = Shell;