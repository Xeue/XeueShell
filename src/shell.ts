import EventEmitter from 'events';
import { Logs, Level } from 'xeue-logs';
import { exec, execSync, ExecOptionsWithStringEncoding, ExecSyncOptionsWithBufferEncoding, ChildProcess } from 'child_process';
import terminate from 'terminate';

export class Shell extends EventEmitter {
    Logs: Logs
    logsText: string = 'SHELL'
    logsLevel: Level = 'C'
    shell: string
    constructor(
        logs: Logs,
        logsText = 'SHELL',
        logsLevel: Level = 'C',
        shell?: string
    ) {
        super();
        if (logs) {
            this.Logs = logs;
        } else {
            this.Logs = new Logs(
                false,
                'shellLogging',
                'shellLogging',
                'D',
            )
        }
        this.logsText = logsText;
        this.logsLevel = logsLevel;
        this.shell = shell ? shell : 'bash';
    }

    run(command: string, doPrint = true) {
        const commandOutput = new Promise((resolve, reject) => {
            const stdout: string[] = [];
            const stderr: string[] = [];
            let hasErrors = false;
            const shellOptions: ExecOptionsWithStringEncoding = {};
            if (this.shell) shellOptions.shell = this.shell
            const proc = exec(command, shellOptions);
            // if (!proc) return reject("Process ")
            if (proc.stdout) {
                proc.stdout.on('data', data => {
                    const output = data.trim();
                    stdout.push(output);

                    this.emit('stdout', output);

                    if (output != "" && doPrint) this.Logs.log(output, [this.logsLevel, this.logsText, this.Logs.p])
                });
            }
            if (proc.stderr) {
                proc.stderr.on('data', data => {
                    const output = data.trim();
                    stderr.push(output);
                    hasErrors = true;

                    this.emit('stderr', output);

                    if (output != "" && doPrint) this.Logs.log(output, [this.logsLevel, this.logsText, this.Logs.r])
                });
            }
            proc.on('exit', () => {
                const output = {
                    "stdout": stdout,
                    "stderr": stderr,
                    "hasErrors": hasErrors,
                    "execProcess": proc
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

    runSync(command: string) {
        const shellOptions: ExecSyncOptionsWithBufferEncoding = {};
        if (this.shell) shellOptions.shell = this.shell
        return execSync(command, shellOptions).toString();
    }

    process(command: string, doPrint = true) {
        const process = new Process();

        const shellOptions: ExecOptionsWithStringEncoding = {};
        if (this.shell) shellOptions.shell = this.shell
        const proc = exec(command, shellOptions);

        process.execProcess = proc;

        if (proc.stdout) {
            proc.stdout.on('data', data => {
                const output = data.trim();
                process.emit('stdout', output);
                if (output != "" && doPrint) this.Logs.log(output, [this.logsLevel, this.logsText, this.Logs.p])
            });
        }
        if (proc.stderr) {
            proc.stderr.on('data', data => {
                const output = data.trim();
                process.emit('stderr', output);
                if (output != "" && doPrint) this.Logs.log(output, [this.logsLevel, this.logsText, this.Logs.r])
            });
        }
        proc.on('exit', () => {
            process.emit('exit');
        });
        proc.on('error', error => {
            process.emit('error', error);
        });

        process.kill = signal => {
            if (!proc.pid) return
            terminate(proc.pid, error => {
                if (error) {
                    if (error.message.includes('No such process')) {
                        this.Logs.error('Process already killed')
                    } else {
                        this.Logs.error('Error killing process', error)
                    }
                }
            })
        };

        return process;
    }


    bash(doPrint = true) {
        const process = new Bash();

        const shellOptions: ExecOptionsWithStringEncoding = {};
        if (this.shell) shellOptions.shell = this.shell
        const bash = exec('bash', shellOptions);

        process.bash = bash;

        if (bash.stdout) {
            bash.stdout.on('data', data => {
                const output = data.trim();
                process.emit('stdout', output);
                if (output != "" && doPrint) this.Logs.log(output, [this.logsLevel, this.logsText, this.Logs.p])
            });
        }
        if (bash.stderr) {
            bash.stderr.on('data', data => {
                const output = data.trim();
                process.emit('stderr', output);
                if (output != "" && doPrint) this.Logs.log(output, [this.logsLevel, this.logsText, this.Logs.r])
            });
        }
        bash.on('exit', () => {
            process.emit('exit');
        });
        bash.on('error', error => {
            process.emit('error', error);
        });

        process.kill = signal => {
            if (!bash.pid) return
            terminate(bash.pid, error => {
                if (error) {
                    if (error.message.includes('No such process')) {
                        this.Logs.error('Process already killed')
                    } else {
                        this.Logs.error('Error killing process', error)
                    }
                }
            })
        };

        process.run = input => {
            if (bash.stdin) bash.stdin.write(`${input}\n`);
        }

        return process;
    }

}

export class Process extends EventEmitter {
    execProcess?: ChildProcess
    kill?: (signal: string) => void
}

export class Bash extends EventEmitter {
    bash?: ChildProcess
    kill?: (signal: string) => void
    run?: (input: string) => void
}

module.exports.Shell = Shell;