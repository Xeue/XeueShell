declare module 'xeue-shell';
import type { ChildProcess } from "child_process"

export class Shell {
    constructor(
        logger: Object,
        logsText: string,
        logsLevel: string,
        shell?: string
    );

	run(
		command: string,
		doPrint: boolean
	): Promise<{
		stdout: Array<string>,
		stderr: Array<string>,
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
		execProcess: ChildProcess,
		on: Function
	}

	bash(
		doPrint: boolean
	): {
		kill: Function,
		bash: ChildProcess,
		run: Function
	}
}

export type {ChildProcess} from "child_process"