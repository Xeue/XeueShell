const EventEmitter = require('events');
const {Logs} = require('xeue-logs');
const {exec, execSync} = require('child_process');
const terminate = require('terminate');

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
				'shellLogging',
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

    runSync(command) {
        const shellOptions = {};
        if (this.shell) shellOptions.shell = this.shell
        return execSync(command, shellOptions).toString();
    }

    process(command, doPrint = true) {
        const process = new EventEmitter();

        const shellOptions = {};
        if (this.shell) shellOptions.shell = this.shell
        const proc = exec(command, shellOptions);

        process.execProcess = proc;

        proc.stdout.on('data', data => {
            const output = data.trim();

            process.emit('stdout', output);

            if (output != "" && doPrint) this.logger.log(output, [this.logsLevel, this.logsText, this.logger.p])
        });
        proc.stderr.on('data', data => {
            const output = data.trim();

            process.emit('stderr', output);

            if (output != "" && doPrint) this.logger.log(output, [this.logsLevel, this.logsText, this.logger.r])
        });
        proc.on('exit', () => {
            process.emit('exit');
        });
        proc.on('error', error => {
            process.emit('error', error);
        });

        process.kill = signal => {
            terminate(proc.pid, error => {
                if (error) {
                    if (error.message.includes('No such process')) {
                        this.logger.error('Process already killed')
                    } else {
                        this.logger.error('Error killing process', error)
                    }
                }
            })
        };

        return process;
    }


    bash(doPrint = true) {
        const process = new EventEmitter();

        const shellOptions = {};
        if (this.shell) shellOptions.shell = this.shell
        const bash = exec('bash', shellOptions);

        process.bash = bash;

        bash.stdout.on('data', data => {
            const output = data.trim();

            process.emit('stdout', output);

            if (output != "" && doPrint) this.logger.log(output, [this.logsLevel, this.logsText, this.logger.p])
        });
        bash.stderr.on('data', data => {
            const output = data.trim();

            process.emit('stderr', output);

            if (output != "" && doPrint) this.logger.log(output, [this.logsLevel, this.logsText, this.logger.r])
        });
        bash.on('exit', () => {
            process.emit('exit');
        });
        bash.on('error', error => {
            process.emit('error', error);
        });

        process.kill = signal => {
            terminate(bash.pid, error => {
                if (error) {
                    if (error.message.includes('No such process')) {
                        this.logger.error('Process already killed')
                    } else {
                        this.logger.error('Error killing process', error)
                    }
                }
            })
        };

        process.run = input => {
            bash.stdin.write(`${input}\n`);
        }

        return process;
    }

}

module.exports.Shell = Shell;