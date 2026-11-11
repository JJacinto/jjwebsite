// UserPromptSubmit hook: when a prompt is a Retune payload, tell Claude to
// handle it with the retune-review skill. Prints nothing for other prompts.
let input = '';
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  let prompt = '';
  try {
    prompt = JSON.parse(input).prompt ?? '';
  } catch {
    return;
  }
  const isRetune =
    /using Retune/i.test(prompt) ||
    /^# (Visual Changes|Comments)\b/m.test(prompt) ||
    /^## Comment #\d+/m.test(prompt);
  if (isRetune) {
    console.log(
      'This prompt is a Retune payload. Use the retune-review skill to handle it: ' +
        'apply each change, then do the principal product designer and content writer passes, ' +
        'keep copy in João\'s voice (see its voice.md), verify in the browser, and report.'
    );
  }
});
