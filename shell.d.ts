declare module 'xeue-shell';

export class Shell {
    constructor(
        logger: Object,
        logsText: string,
        logsLevel: string,
        shell: string
    ) {}


	run(
		command: string,
		doPrint: boolean
	): Promise<{
		stdout: arr[],
		stderr: arr[],
		hasErrors: boolean,
		execProcess: ChildProcess
	}>

	runSync(
		command: string
	): string

	process(
		command: string,
		doPrint: boolean
	): {
		kill: Function,
		execProcess: ChildProcess
	}
}