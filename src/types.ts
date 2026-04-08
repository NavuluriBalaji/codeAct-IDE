export enum CodeActState {
    TRACE_EXECUTION = 'TRACE_EXECUTION',
    MUTATE_ANALYSIS = 'MUTATE_ANALYSIS',
    GENERATE_DIFF = 'GENERATE_DIFF',
    EXPLAIN_CONCEPT = 'EXPLAIN_CONCEPT',
    RUN_TESTS = 'RUN_TESTS',
    SEARCH_CODEBASE = 'SEARCH_CODEBASE',
    DEBUG_ERROR = 'DEBUG_ERROR',
}

export interface ExecutionResult {
    stdout: string;
    stderr: string;
    exit_code: number;
    execution_time_ms: number;
}
