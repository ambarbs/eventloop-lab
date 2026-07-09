import { parse } from '@babel/parser';
import type { RuntimeStep } from '@/lib/runtimeTrace';

type SourceLocation = {
  start: {
    line: number;
  };
};

type AstNode = {
  type: string;
  loc?: SourceLocation | null;
  [key: string]: unknown;
};

type AsyncTask = {
  kind: 'timer' | 'promise';
  sourceLine: number;
  callbackLine: number;
  output: string | null;
};

type TraceState = {
  steps: RuntimeStep[];
  consoleOutput: string[];
  functions: Map<string, AstNode>;
  microtasks: AsyncTask[];
  macrotasks: AsyncTask[];
};

function asNode(value: unknown): AstNode | null {
  if (
    value &&
    typeof value === 'object' &&
    'type' in value &&
    typeof (value as { type: unknown }).type === 'string'
  ) {
    return value as AstNode;
  }

  return null;
}

function getNode(node: AstNode, key: string): AstNode | null {
  return asNode(node[key]);
}

function getNodeArray(node: AstNode, key: string): AstNode[] {
  const value = node[key];

  if (!Array.isArray(value)) return [];

  return value.map(asNode).filter((item): item is AstNode => item !== null);
}

function getString(node: AstNode, key: string): string | null {
  const value = node[key];
  return typeof value === 'string' ? value : null;
}

function getLine(node: AstNode): number {
  return node.loc?.start.line ?? 1;
}

function getIdentifierName(node: AstNode | null): string | null {
  if (!node || node.type !== 'Identifier') return null;
  return getString(node, 'name');
}

function isMemberExpressionNamed(
  node: AstNode | null,
  objectName: string,
  propertyName: string,
): boolean {
  if (!node || node.type !== 'MemberExpression') return false;

  const object = getNode(node, 'object');
  const property = getNode(node, 'property');

  return (
    getIdentifierName(object) === objectName &&
    getIdentifierName(property) === propertyName
  );
}

function isConsoleLogCall(node: AstNode): boolean {
  if (node.type !== 'CallExpression') return false;

  const callee = getNode(node, 'callee');

  return isMemberExpressionNamed(callee, 'console', 'log');
}

function isSetTimeoutCall(node: AstNode): boolean {
  if (node.type !== 'CallExpression') return false;

  const callee = getNode(node, 'callee');

  return getIdentifierName(callee) === 'setTimeout';
}

function isPromiseResolveThenCall(node: AstNode): boolean {
  if (node.type !== 'CallExpression') return false;

  const callee = getNode(node, 'callee');

  if (!callee || callee.type !== 'MemberExpression') return false;

  const thenProperty = getNode(callee, 'property');
  const thenObject = getNode(callee, 'object');

  if (getIdentifierName(thenProperty) !== 'then') return false;
  if (!thenObject || thenObject.type !== 'CallExpression') return false;

  const resolveCallee = getNode(thenObject, 'callee');

  return isMemberExpressionNamed(resolveCallee, 'Promise', 'resolve');
}

function evaluateExpression(
  node: AstNode | null,
  scope: Map<string, string>,
): string | null {
  if (!node) return null;

  if (node.type === 'StringLiteral') {
    const value = node.value;
    return typeof value === 'string' ? value : null;
  }

  if (node.type === 'NumericLiteral') {
    const value = node.value;
    return typeof value === 'number' ? String(value) : null;
  }

  if (node.type === 'BooleanLiteral') {
    const value = node.value;
    return typeof value === 'boolean' ? String(value) : null;
  }

  if (node.type === 'Identifier') {
    const name = getIdentifierName(node);
    return name ? (scope.get(name) ?? null) : null;
  }

  if (node.type === 'CallExpression') {
    const callee = getNode(node, 'callee');

    if (callee?.type === 'MemberExpression') {
      const object = getNode(callee, 'object');
      const property = getNode(callee, 'property');
      const objectValue = evaluateExpression(object, scope);

      if (objectValue && getIdentifierName(property) === 'toUpperCase') {
        return objectValue.toUpperCase();
      }

      if (objectValue && getIdentifierName(property) === 'toLowerCase') {
        return objectValue.toLowerCase();
      }
    }
  }

  return null;
}

function getConsoleLogOutput(
  callExpression: AstNode,
  scope: Map<string, string>,
): string | null {
  const firstArgument = getNodeArray(callExpression, 'arguments')[0];
  return evaluateExpression(firstArgument ?? null, scope);
}

function queueSnapshot(tasks: AsyncTask[], label: 'promise' | 'timer') {
  return tasks.map((task) =>
    label === 'promise'
      ? `Promise callback from line ${task.callbackLine}`
      : `Timer callback from line ${task.callbackLine}`,
  );
}

function getCurrentQueues(state: TraceState) {
  return {
    microtasks: queueSnapshot(state.microtasks, 'promise'),
    macrotasks: queueSnapshot(state.macrotasks, 'timer'),
  };
}

function findFirstConsoleLogInCallback(callbackNode: AstNode | null): {
  line: number;
  output: string | null;
} {
  if (!callbackNode) {
    return {
      line: 1,
      output: null,
    };
  }

  const callbackLine = getLine(callbackNode);

  if (
    callbackNode.type !== 'ArrowFunctionExpression' &&
    callbackNode.type !== 'FunctionExpression'
  ) {
    return {
      line: callbackLine,
      output: null,
    };
  }

  const body = getNode(callbackNode, 'body');

  if (!body) {
    return {
      line: callbackLine,
      output: null,
    };
  }

  if (body.type === 'CallExpression' && isConsoleLogCall(body)) {
    return {
      line: getLine(body),
      output: getConsoleLogOutput(body, new Map()),
    };
  }

  if (body.type !== 'BlockStatement') {
    return {
      line: getLine(body),
      output: null,
    };
  }

  const statements = getNodeArray(body, 'body');

  for (const statement of statements) {
    if (statement.type !== 'ExpressionStatement') continue;

    const expression = getNode(statement, 'expression');

    if (expression && isConsoleLogCall(expression)) {
      return {
        line: getLine(expression),
        output: getConsoleLogOutput(expression, new Map()),
      };
    }
  }

  return {
    line: callbackLine,
    output: null,
  };
}

function addUnsupportedStep(message: string): RuntimeStep[] {
  return [
    {
      line: 1,
      phase: 'sync',
      title: 'No supported runtime steps found',
      explanation: message,
      events: [
        'Try console.log("A")',
        'Try setTimeout(() => { console.log("B") }, 0)',
        'Try Promise.resolve().then(() => { console.log("C") })',
      ],
      callStack: [],
      webApis: [],
      microtasks: [],
      macrotasks: [],
      consoleOutput: [],
    },
  ];
}

function addConsoleLogStep(
  callExpression: AstNode,
  state: TraceState,
  stackPrefix: string[],
  scope: Map<string, string>,
) {
  const output = getConsoleLogOutput(callExpression, scope);

  if (output === null) return;

  state.consoleOutput.push(output);

  const queues = getCurrentQueues(state);

  state.steps.push({
    line: getLine(callExpression),
    phase: 'sync',
    title: `Run console.log("${output}")`,
    explanation:
      'This console.log runs synchronously on the call stack and executes immediately.',
    events: [
      `Push console.log("${output}") onto the call stack`,
      `Print ${output} to console`,
      `Pop console.log("${output}") from the call stack`,
    ],
    callStack: [...stackPrefix, `console.log("${output}")`],
    webApis: [],
    microtasks: queues.microtasks,
    macrotasks: queues.macrotasks,
    consoleOutput: [...state.consoleOutput],
  });
}

function addSetTimeoutStep(callExpression: AstNode, state: TraceState) {
  const firstArgument = getNodeArray(callExpression, 'arguments')[0] ?? null;
  const callbackDetails = findFirstConsoleLogInCallback(firstArgument);

  const task: AsyncTask = {
    kind: 'timer',
    sourceLine: getLine(callExpression),
    callbackLine: callbackDetails.line,
    output: callbackDetails.output,
  };

  state.macrotasks.push(task);

  const queues = getCurrentQueues(state);

  state.steps.push({
    line: getLine(callExpression),
    phase: 'web-api',
    title: 'Register timer',
    explanation:
      'setTimeout is called. The callback is registered with the browser timer API. The callback body does not run immediately.',
    events: [
      'Push setTimeout(...) onto the call stack',
      'Register timer callback with the browser timer API',
      'Timer callback will later enter the macrotask queue',
      'Pop setTimeout(...) from the call stack',
    ],
    callStack: ['global()', 'setTimeout(...)'],
    webApis: [`Timer registered from line ${getLine(callExpression)}`],
    microtasks: queues.microtasks,
    macrotasks: queues.macrotasks,
    consoleOutput: [...state.consoleOutput],
  });
}

function addPromiseThenStep(callExpression: AstNode, state: TraceState) {
  const firstArgument = getNodeArray(callExpression, 'arguments')[0] ?? null;
  const callbackDetails = findFirstConsoleLogInCallback(firstArgument);

  const task: AsyncTask = {
    kind: 'promise',
    sourceLine: getLine(callExpression),
    callbackLine: callbackDetails.line,
    output: callbackDetails.output,
  };

  state.microtasks.push(task);

  const queues = getCurrentQueues(state);

  state.steps.push({
    line: getLine(callExpression),
    phase: 'microtask',
    title: 'Schedule promise callback',
    explanation:
      'Promise.resolve().then(...) schedules its callback into the microtask queue. It will run after synchronous code finishes.',
    events: [
      'Push Promise.then(...) onto the call stack',
      'Create resolved promise reaction',
      'Insert promise callback into the microtask queue',
      'Pop Promise.then(...) from the call stack',
    ],
    callStack: ['global()', 'Promise.then(...)'],
    webApis: [],
    microtasks: queues.microtasks,
    macrotasks: queues.macrotasks,
    consoleOutput: [...state.consoleOutput],
  });
}

function addFunctionDeclarationStep(functionNode: AstNode, state: TraceState) {
  const functionName = getIdentifierName(getNode(functionNode, 'id'));

  if (!functionName) return;

  state.functions.set(functionName, functionNode);

  const queues = getCurrentQueues(state);

  state.steps.push({
    line: getLine(functionNode),
    phase: 'sync',
    title: `Store ${functionName} function`,
    explanation:
      'The function declaration is stored during the global setup phase. The function body does not run until the function is called.',
    events: [
      `Create function binding for ${functionName}`,
      'Do not execute the function body yet',
    ],
    callStack: ['global()'],
    webApis: [],
    microtasks: queues.microtasks,
    macrotasks: queues.macrotasks,
    consoleOutput: [...state.consoleOutput],
  });
}

function formatFunctionCallLabel(functionName: string, args: string[]) {
  return `${functionName}(${args.map((arg) => `"${arg}"`).join(', ')})`;
}

function executeFunctionCall(
  callExpression: AstNode,
  state: TraceState,
  stackPrefix: string[],
  parentScope: Map<string, string>,
  depth = 0,
) {
  if (depth > 10) return;

  const functionName = getIdentifierName(getNode(callExpression, 'callee'));

  if (!functionName) return;

  const functionNode = state.functions.get(functionName);

  if (!functionNode) return;

  const argumentValues = getNodeArray(callExpression, 'arguments').map(
    (argument) => evaluateExpression(argument, parentScope) ?? 'unknown',
  );

  const functionLabel = formatFunctionCallLabel(functionName, argumentValues);

  const queues = getCurrentQueues(state);

  state.steps.push({
    line: getLine(callExpression),
    phase: 'sync',
    title: `Call ${functionName}`,
    explanation: `${functionName} is pushed onto the call stack. Its body starts executing.`,
    events: [
      `Push ${functionLabel} onto the call stack`,
      `Start executing ${functionName}`,
    ],
    callStack: [...stackPrefix, functionLabel],
    webApis: [],
    microtasks: queues.microtasks,
    macrotasks: queues.macrotasks,
    consoleOutput: [...state.consoleOutput],
  });

  const functionScope = new Map<string, string>();
  const params = getNodeArray(functionNode, 'params');

  params.forEach((param, index) => {
    const paramName = getIdentifierName(param);

    if (paramName) {
      functionScope.set(paramName, argumentValues[index] ?? 'unknown');
    }
  });

  const body = getNode(functionNode, 'body');

  if (!body || body.type !== 'BlockStatement') return;

  const statements = getNodeArray(body, 'body');

  statements.forEach((statement) => {
    if (statement.type !== 'ExpressionStatement') return;

    const expression = getNode(statement, 'expression');

    if (!expression || expression.type !== 'CallExpression') return;

    if (isConsoleLogCall(expression)) {
      addConsoleLogStep(
        expression,
        state,
        [...stackPrefix, functionLabel],
        functionScope,
      );
      return;
    }

    executeFunctionCall(
      expression,
      state,
      [...stackPrefix, functionLabel],
      functionScope,
      depth + 1,
    );
  });
}

function processExpressionStatement(statement: AstNode, state: TraceState) {
  const expression = getNode(statement, 'expression');

  if (!expression || expression.type !== 'CallExpression') return;

  if (isConsoleLogCall(expression)) {
    addConsoleLogStep(expression, state, ['global()'], new Map());
    return;
  }

  if (isSetTimeoutCall(expression)) {
    addSetTimeoutStep(expression, state);
    return;
  }

  if (isPromiseResolveThenCall(expression)) {
    addPromiseThenStep(expression, state);
    return;
  }

  executeFunctionCall(expression, state, ['global()'], new Map());
}

function drainMicrotasks(state: TraceState) {
  while (state.microtasks.length > 0) {
    const task = state.microtasks.shift();

    if (!task) return;

    if (task.output) {
      state.consoleOutput.push(task.output);
    }

    const queues = getCurrentQueues(state);

    state.steps.push({
      line: task.callbackLine,
      phase: 'microtask',
      title: 'Run promise callback',
      explanation:
        'After synchronous code finishes, the event loop drains the microtask queue before running timer callbacks.',
      events: task.output
        ? [
            'Event loop checks the microtask queue first',
            'Move promise callback onto the call stack',
            `Push console.log("${task.output}") onto the call stack`,
            `Print ${task.output} to console`,
            'Microtask callback finishes',
          ]
        : [
            'Event loop checks the microtask queue first',
            'Move promise callback onto the call stack',
            'No supported console.log found inside this callback',
            'Microtask callback finishes',
          ],
      callStack: [
        'Promise callback',
        ...(task.output ? [`console.log("${task.output}")`] : []),
      ],
      webApis: [],
      microtasks: queues.microtasks,
      macrotasks: queues.macrotasks,
      consoleOutput: [...state.consoleOutput],
    });
  }
}

function drainMacrotasks(state: TraceState) {
  while (state.macrotasks.length > 0) {
    const task = state.macrotasks.shift();

    if (!task) return;

    if (task.output) {
      state.consoleOutput.push(task.output);
    }

    const queues = getCurrentQueues(state);

    state.steps.push({
      line: task.callbackLine,
      phase: 'macrotask',
      title: 'Run timer callback',
      explanation:
        'After the microtask queue is empty, the event loop moves the timer callback onto the call stack.',
      events: task.output
        ? [
            'Event loop checks the macrotask queue',
            'Move timer callback onto the call stack',
            `Push console.log("${task.output}") onto the call stack`,
            `Print ${task.output} to console`,
            'Timer callback finishes',
          ]
        : [
            'Event loop checks the macrotask queue',
            'Move timer callback onto the call stack',
            'No supported console.log found inside this callback',
            'Timer callback finishes',
          ],
      callStack: [
        'Timer callback',
        ...(task.output ? [`console.log("${task.output}")`] : []),
      ],
      webApis: [],
      microtasks: queues.microtasks,
      macrotasks: queues.macrotasks,
      consoleOutput: [...state.consoleOutput],
    });
  }
}

export function buildRuntimeTrace(code: string): RuntimeStep[] {
  let ast: AstNode;

  try {
    ast = parse(code, {
      sourceType: 'unambiguous',
      plugins: ['typescript'],
    }) as unknown as AstNode;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'The code could not be parsed.';

    return [
      {
        line: 1,
        phase: 'sync',
        title: 'Parser error',
        explanation: message,
        events: [
          'Check for missing brackets, commas, or parentheses',
          'Parser v1 supports only a small JavaScript subset',
        ],
        callStack: [],
        webApis: [],
        microtasks: [],
        macrotasks: [],
        consoleOutput: [],
      },
    ];
  }

  const program = getNode(ast, 'program');
  const body = program ? getNodeArray(program, 'body') : [];

  const state: TraceState = {
    steps: [],
    consoleOutput: [],
    functions: new Map(),
    microtasks: [],
    macrotasks: [],
  };

  body.forEach((statement) => {
    if (statement.type === 'FunctionDeclaration') {
      addFunctionDeclarationStep(statement, state);
      return;
    }

    if (statement.type === 'ExpressionStatement') {
      processExpressionStatement(statement, state);
    }
  });

  drainMicrotasks(state);
  drainMacrotasks(state);

  if (state.steps.length === 0) {
    return addUnsupportedStep(
      'This parser could read the code, but it did not find any currently supported runtime patterns.',
    );
  }

  return state.steps;
}
