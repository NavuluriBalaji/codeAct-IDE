const qs = (id) => document.getElementById(id);
const runBtn = qs('runBtn');
const queryInput = qs('queryInput');
const scriptOutput = qs('scriptOutput');
const resultOutput = qs('resultOutput');
const statusText = qs('status');
// @ts-ignore
window.codeactAPI.onToken((token) => {
    scriptOutput.innerText += token;
    scriptOutput.scrollTop = scriptOutput.scrollHeight;
});
runBtn.addEventListener('click', async () => {
    const query = queryInput.value.trim();
    if (!query)
        return;
    statusText.innerText = "Generating PoT Script...";
    scriptOutput.innerText = "";
    resultOutput.innerText = "";
    runBtn.disabled = true;
    try {
        // @ts-ignore
        const response = await window.codeactAPI.executeLoop(query);
        if (response.error) {
            statusText.innerText = "Error!";
            scriptOutput.innerText = response.script || scriptOutput.innerText || "Failed getting LLM output";
            resultOutput.innerText = `Error:\n${response.error}`;
        }
        else {
            // Re-render perfectly extracted code block at end just in case
            scriptOutput.innerText = response.script;
            let finalOutput = response.result.stdout || "";
            if (response.result.stderr) {
                finalOutput += `\n[STDERR]\n${response.result.stderr}`;
            }
            if (!finalOutput)
                finalOutput = "No text output generated.";
            statusText.innerText = `Done! Execution latency: ${response.execution_time_ms}ms (Exit: ${response.result.exit_code})`;
            resultOutput.innerText = finalOutput;
        }
    }
    catch (err) {
        statusText.innerText = "Fatal Failure";
        resultOutput.innerText = err.message;
    }
    finally {
        runBtn.disabled = false;
    }
});
export {};
