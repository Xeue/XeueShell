const EventEmitter = require('events');
const {Logs} = require('xeue-logs');
const {exec} = require('child_process');

class Shell extends EventEmitter {
	constructor(
		logger,
        logsText = 'SHELL',
        logsLevel = 'C',
        shell
	) {
        super();
		if (logger) {
			this.logger = logger;
		} else {
			this.logger = new Logs(
				false,
				'shellLogging',
				path.join(__data, 'shellLogging'),
				'D',
				false
			)
		}
        this.logsText = logsText;
        this.logsLevel = logsLevel;
        if (shell) this.shell = shell;
	}

    run(command, doPrint = true) {
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

                this.emit('stdout', output);

                if (output != "" && doPrint) this.logger.log(output, [this.logsLevel, this.logsText, this.logger.p])
            });
            proc.stderr.on('data', data => {
                const output = data.trim();
                stderr.push(output);
                hasErrors = true;

                this.emit('stderr', output);

                if (output != "" && doPrint) this.logger.log(output, [this.logsLevel, this.logsText, this.logger.r])
            });
            proc.on('exit', () => {
                const output = {
                    "stdout":stdout,
                    "stderr":stderr,
                    "hasErrors":hasErrors,
                    "execProcess":proc
                }
                this.emit('exit', output);
                resolve(output)
            });
            proc.on('error', error => {
                this.emit('error', error);
                reject(error)
            });
        });

        return commandOutput;
    }
}

module.exports.Shell = Shell;