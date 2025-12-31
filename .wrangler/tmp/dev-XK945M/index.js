var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var isWorkerdProcessV2 = globalThis.Cloudflare.compatibilityFlags.enable_nodejs_process_v2;
var unenvProcess = new Process({
  env: globalProcess.env,
  // `hrtime` is only available from workerd process v2
  hrtime: isWorkerdProcessV2 ? workerdProcess.hrtime : hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  // Always implemented by workerd
  env,
  // Only implemented in workerd v2
  hrtime: hrtime3,
  // Always implemented by workerd
  nextTick
} = unenvProcess;
var {
  _channel,
  _disconnect,
  _events,
  _eventsCount,
  _handleQueue,
  _maxListeners,
  _pendingMessage,
  _send,
  assert: assert2,
  disconnect,
  mainModule
} = unenvProcess;
var {
  // @ts-expect-error `_debugEnd` is missing typings
  _debugEnd,
  // @ts-expect-error `_debugProcess` is missing typings
  _debugProcess,
  // @ts-expect-error `_exiting` is missing typings
  _exiting,
  // @ts-expect-error `_fatalException` is missing typings
  _fatalException,
  // @ts-expect-error `_getActiveHandles` is missing typings
  _getActiveHandles,
  // @ts-expect-error `_getActiveRequests` is missing typings
  _getActiveRequests,
  // @ts-expect-error `_kill` is missing typings
  _kill,
  // @ts-expect-error `_linkedBinding` is missing typings
  _linkedBinding,
  // @ts-expect-error `_preload_modules` is missing typings
  _preload_modules,
  // @ts-expect-error `_rawDebug` is missing typings
  _rawDebug,
  // @ts-expect-error `_startProfilerIdleNotifier` is missing typings
  _startProfilerIdleNotifier,
  // @ts-expect-error `_stopProfilerIdleNotifier` is missing typings
  _stopProfilerIdleNotifier,
  // @ts-expect-error `_tickCallback` is missing typings
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  availableMemory,
  // @ts-expect-error `binding` is missing typings
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  // @ts-expect-error `domain` is missing typings
  domain,
  emit,
  emitWarning,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  // @ts-expect-error `initgroups` is missing typings
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  memoryUsage,
  // @ts-expect-error `moduleLoadList` is missing typings
  moduleLoadList,
  off,
  on,
  once,
  // @ts-expect-error `openStdin` is missing typings
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  // @ts-expect-error `reallyExit` is missing typings
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = isWorkerdProcessV2 ? workerdProcess : unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// workers/lib/embeddings.ts
async function generateEmbedding(text, env2) {
  const response = await env2.AI.run("@cf/baai/bge-large-en-v1.5", {
    text: [text]
  });
  return response.data[0];
}
__name(generateEmbedding, "generateEmbedding");
async function generateEmbeddings(texts, env2) {
  const response = await env2.AI.run("@cf/baai/bge-large-en-v1.5", {
    text: texts
  });
  return response.data;
}
__name(generateEmbeddings, "generateEmbeddings");
function chunkDocument(content, chunkSize = 1e3, chunkOverlap = 200) {
  const chunks = [];
  let start = 0;
  while (start < content.length) {
    const end = Math.min(start + chunkSize, content.length);
    const chunk = content.slice(start, end);
    if (end < content.length) {
      const lastPeriod = chunk.lastIndexOf(".");
      const lastNewline = chunk.lastIndexOf("\n");
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > chunkSize * 0.5) {
        chunks.push(content.slice(start, start + breakPoint + 1));
        start += breakPoint + 1 - chunkOverlap;
        continue;
      }
    }
    chunks.push(chunk);
    start += chunkSize - chunkOverlap;
  }
  return chunks;
}
__name(chunkDocument, "chunkDocument");
async function storeDocumentEmbeddings(sourceId, content, metadata, env2) {
  const chunks = chunkDocument(content);
  const batchSize = 10;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const embeddings = await generateEmbeddings(batch, env2);
    const vectors = batch.map((chunk, idx) => ({
      id: `${sourceId}-chunk-${i + idx}`,
      values: embeddings[idx],
      metadata: {
        sourceId,
        content: chunk,
        chunkIndex: i + idx,
        title: metadata.title,
        type: metadata.type
      }
    }));
    await env2.VECTORIZE.upsert(vectors);
  }
}
__name(storeDocumentEmbeddings, "storeDocumentEmbeddings");
async function searchRelevantChunks(query, sourceId, topK = 5, env2) {
  const queryEmbedding = await generateEmbedding(query, env2);
  const results = await env2.VECTORIZE.query(queryEmbedding, {
    topK,
    filter: sourceId ? { sourceId } : void 0
  });
  return results.matches.map((match) => ({
    id: match.id,
    sourceId: match.metadata.sourceId,
    content: match.metadata.content,
    embedding: match.vector,
    metadata: {
      page: match.metadata.page,
      timestamp: match.metadata.timestamp,
      section: match.metadata.section
    }
  }));
}
__name(searchRelevantChunks, "searchRelevantChunks");
async function deleteSourceEmbeddings(sourceId, env2) {
  const results = await env2.VECTORIZE.query(new Array(1024).fill(0), {
    topK: 1e3,
    filter: { sourceId }
  });
  const ids = results.matches.map((m) => m.id);
  if (ids.length > 0) {
    await env2.VECTORIZE.deleteByIds(ids);
  }
}
__name(deleteSourceEmbeddings, "deleteSourceEmbeddings");

// workers/lib/llm.ts
async function generateText(prompt, systemPrompt, env2, options = {}) {
  if (!env2) {
    throw new Error("Environment not provided");
  }
  const messages = [];
  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt
    });
  }
  messages.push({
    role: "user",
    content: prompt
  });
  const response = await env2.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2048,
    stream: options.stream ?? false
  });
  if (options.stream) {
    return response;
  }
  return response.response;
}
__name(generateText, "generateText");
async function generateWithHistory(messages, env2, options = {}) {
  const response = await env2.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2048
  });
  return response.response;
}
__name(generateWithHistory, "generateWithHistory");
async function generateJSON(prompt, systemPrompt, jsonSchema, env2) {
  const fullPrompt = `${prompt}

You MUST respond with valid JSON matching this schema:
${jsonSchema}`;
  const response = await generateText(fullPrompt, systemPrompt, env2, {
    temperature: 0.3
    // Lower temperature for more structured output
  });
  const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to extract JSON from response");
  }
  const jsonStr = jsonMatch[1] || jsonMatch[0];
  return JSON.parse(jsonStr);
}
__name(generateJSON, "generateJSON");

// workers/lib/chat.ts
async function chatWithDocument(request, env2) {
  const { sourceId, message, conversationHistory = [] } = request;
  const relevantChunks = await searchRelevantChunks(message, sourceId, 5, env2);
  const context2 = relevantChunks.map((chunk, idx) => `[Source ${idx + 1}]
${chunk.content}`).join("\n\n");
  const systemPrompt = `You are a helpful AI assistant that answers questions based on provided documents.
Use the following context to answer the user's question accurately.
Always cite your sources by referencing [Source N] in your answer.
If the context doesn't contain enough information, say so clearly.

Context:
${context2}

Guidelines:
- Be concise but comprehensive
- Use bullet points for lists
- Quote directly when appropriate
- Always cite sources with [Source N]
- If information is not in context, clearly state that`;
  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
    { role: "user", content: message }
  ];
  const response = await generateWithHistory(messages, env2, {
    temperature: 0.7,
    maxTokens: 1500
  });
  const sources = relevantChunks.map((chunk, idx) => ({
    sourceId: chunk.sourceId,
    chunk: chunk.content.substring(0, 200) + "...",
    page: chunk.metadata.page,
    timestamp: chunk.metadata.timestamp,
    relevance: (5 - idx) / 5
    // Simple relevance score based on ranking
  }));
  const conversationId = crypto.randomUUID();
  return {
    response,
    sources,
    conversationId
  };
}
__name(chatWithDocument, "chatWithDocument");
async function continueChatConversation(conversationId, message, env2) {
  const historyKey = `chat:${conversationId}`;
  const historyJson = await env2.CACHE.get(historyKey);
  const conversationHistory = historyJson ? JSON.parse(historyJson) : [];
  const metadataKey = `chat:meta:${conversationId}`;
  const metadataJson = await env2.CACHE.get(metadataKey);
  const metadata = metadataJson ? JSON.parse(metadataJson) : {};
  const sourceId = metadata.sourceId;
  const response = await chatWithDocument(
    {
      sourceId,
      message,
      conversationHistory
    },
    env2
  );
  conversationHistory.push(
    { role: "user", content: message },
    { role: "assistant", content: response.response }
  );
  await env2.CACHE.put(historyKey, JSON.stringify(conversationHistory), {
    expirationTtl: 86400
  });
  return response;
}
__name(continueChatConversation, "continueChatConversation");

// workers/lib/study-guide.ts
async function generateStudyGuide(request, env2) {
  const { sourceId, focusAreas = [], difficulty = "intermediate" } = request;
  const allChunks = await searchRelevantChunks("main topics and key concepts", sourceId, 20, env2);
  const fullContent = allChunks.map((c) => c.content).join("\n\n");
  const overview = await generateOverview(fullContent, difficulty, env2);
  const keyTopics = await extractKeyTopics(fullContent, focusAreas, env2);
  const timeline = await generateTimeline(fullContent, env2);
  const vocabulary = await extractVocabulary(fullContent, env2);
  const practiceQuestions = await generatePracticeQuestions(fullContent, difficulty, env2);
  const title2 = await generateTitle(fullContent, env2);
  return {
    title: title2,
    overview,
    keyTopics,
    timeline,
    vocabulary,
    practiceQuestions
  };
}
__name(generateStudyGuide, "generateStudyGuide");
async function generateOverview(content, difficulty, env2) {
  const systemPrompt = `Create a comprehensive overview of this content suitable for ${difficulty} level learners.
The overview should:
- Summarize the main themes and ideas
- Explain the significance and context
- Be 200-300 words
- Use clear, accessible language`;
  return generateText(content, systemPrompt, env2, {
    temperature: 0.6,
    maxTokens: 500
  });
}
__name(generateOverview, "generateOverview");
async function extractKeyTopics(content, focusAreas, env2) {
  const systemPrompt = `Identify and organize the key topics from this content.
${focusAreas.length > 0 ? `Focus particularly on: ${focusAreas.join(", ")}` : ""}

For each topic, provide:
- Main topic name
- Concise summary (2-3 sentences)
- List of subtopics
- Importance score (1-10)

Return as JSON array following this schema:
[{
  "topic": "Main Topic Name",
  "summary": "Brief explanation...",
  "subtopics": ["subtopic1", "subtopic2"],
  "importance": 8
}]`;
  const prompt = `Content to analyze:

${content.substring(0, 8e3)}`;
  const schema = `[{"topic": "...", "summary": "...", "subtopics": [...], "importance": 1-10}]`;
  const topics = await generateJSON(prompt, systemPrompt, schema, env2);
  return topics.sort((a, b) => b.importance - a.importance);
}
__name(extractKeyTopics, "extractKeyTopics");
async function generateTimeline(content, env2) {
  const systemPrompt = `Analyze if this content contains chronological/historical events.
If yes, create a timeline of key events.
If no, return empty array.

For each event, provide:
- Date (if mentioned, otherwise null)
- Event name
- Brief description
- Why it's significant

Return as JSON array:
[{
  "date": "1969-07-20" or null,
  "event": "Event name",
  "description": "What happened...",
  "significance": "Why it matters..."
}]`;
  const prompt = `Content to analyze for timeline:

${content.substring(0, 6e3)}`;
  try {
    const timeline = await generateJSON(
      prompt,
      systemPrompt,
      '[{"date": "...", "event": "...", "description": "...", "significance": "..."}]',
      env2
    );
    return timeline.length > 0 ? timeline : void 0;
  } catch {
    return void 0;
  }
}
__name(generateTimeline, "generateTimeline");
async function extractVocabulary(content, env2) {
  const systemPrompt = `Identify important vocabulary terms and concepts from this content.
Focus on:
- Technical terms
- Specialized vocabulary
- Key concepts
- Terms that might be unfamiliar to learners

For each term, provide:
- The term itself
- Clear, concise definition
- Context/example from the source material

Return top 10-15 most important terms as JSON:
[{
  "term": "Term name",
  "definition": "Clear definition...",
  "context": "How it's used in the content..."
}]`;
  const prompt = `Content to analyze:

${content.substring(0, 6e3)}`;
  const schema = `[{"term": "...", "definition": "...", "context": "..."}]`;
  return generateJSON(prompt, systemPrompt, schema, env2);
}
__name(extractVocabulary, "extractVocabulary");
async function generatePracticeQuestions(content, difficulty, env2) {
  const systemPrompt = `Generate 8-10 practice questions based on this content.
Difficulty level: ${difficulty}

Questions should:
- Cover different aspects of the material
- Vary in type (recall, analysis, application)
- Be clear and specific
- Encourage deep thinking

Return only a JSON array of question strings (no answers).`;
  const prompt = `Content for questions:

${content.substring(0, 6e3)}`;
  const schema = `["Question 1?", "Question 2?", ...]`;
  return generateJSON(prompt, systemPrompt, schema, env2);
}
__name(generatePracticeQuestions, "generatePracticeQuestions");
async function generateTitle(content, env2) {
  const systemPrompt = `Generate a clear, descriptive title for a study guide based on this content.
The title should be:
- 5-10 words
- Descriptive of the main topic
- Professional and academic in tone

Return only the title text, nothing else.`;
  const prompt = content.substring(0, 1e3);
  return generateText(prompt, systemPrompt, env2, {
    temperature: 0.5,
    maxTokens: 50
  });
}
__name(generateTitle, "generateTitle");
async function generateStudyPlan(studyGuide, targetDays, env2) {
  const systemPrompt = `Create a ${targetDays}-day study plan based on this study guide.
Distribute topics logically across days, starting with fundamentals.

Return JSON array:
[{
  "day": 1,
  "topics": ["Topic to cover"],
  "tasks": ["Specific task 1", "Specific task 2"],
  "estimatedHours": 2
}]`;
  const prompt = `Study Guide Summary:
Title: ${studyGuide.title}
Key Topics: ${studyGuide.keyTopics.map((t) => t.topic).join(", ")}
Number of vocabulary terms: ${studyGuide.vocabulary.length}
Practice questions: ${studyGuide.practiceQuestions.length}`;
  const schema = `[{"day": 1, "topics": [...], "tasks": [...], "estimatedHours": 1}]`;
  return generateJSON(prompt, systemPrompt, schema, env2);
}
__name(generateStudyPlan, "generateStudyPlan");

// workers/lib/flashcards.ts
async function generateFlashcards(request, env2) {
  const { sourceId, count: count3 = 20, difficulty = "medium", topics = [] } = request;
  const searchQuery = topics.length > 0 ? `key concepts and facts about ${topics.join(", ")}` : "important concepts, facts, and definitions";
  const chunks = await searchRelevantChunks(searchQuery, sourceId, 15, env2);
  const content = chunks.map((c) => c.content).join("\n\n");
  const batchSize = 10;
  const allCards = [];
  for (let i = 0; i < count3; i += batchSize) {
    const batchCount = Math.min(batchSize, count3 - i);
    const cards = await generateFlashcardBatch(content, batchCount, difficulty, topics, env2);
    allCards.push(...cards);
  }
  const uniqueCards = deduplicateFlashcards(allCards);
  const rankedCards = await rankFlashcardsByQuality(uniqueCards, env2);
  const sourceTitle = await getSourceTitle(sourceId, content, env2);
  return {
    cards: rankedCards.slice(0, count3),
    metadata: {
      totalGenerated: rankedCards.length,
      difficulty,
      sourceTitle
    }
  };
}
__name(generateFlashcards, "generateFlashcards");
async function generateFlashcardBatch(content, count3, difficulty, topics, env2) {
  const systemPrompt = `You are an expert educator creating high-quality flashcards.

Create exactly ${count3} flashcards with these criteria:
- Difficulty: ${difficulty}
${topics.length > 0 ? `- Focus topics: ${topics.join(", ")}` : ""}
- Each card should test one specific concept
- Questions should be clear and unambiguous
- Answers should be concise but complete
- Include helpful hints when appropriate
- Vary question types (definition, application, comparison, etc.)

Return JSON array:
[{
  "front": "Question or prompt (clear and specific)",
  "back": "Answer (concise and accurate)",
  "hint": "Optional hint (use null if not needed)",
  "difficulty": 1-10 (1=easiest, 10=hardest),
  "topic": "Specific topic this card covers",
  "sourceReference": "Quote or reference from source material"
}]`;
  const prompt = `Source material:

${content.substring(0, 6e3)}`;
  const schema = `[{
    "front": "...",
    "back": "...",
    "hint": "..." or null,
    "difficulty": 1-10,
    "topic": "...",
    "sourceReference": "..."
  }]`;
  return generateJSON(prompt, systemPrompt, schema, env2);
}
__name(generateFlashcardBatch, "generateFlashcardBatch");
function deduplicateFlashcards(cards) {
  const unique = [];
  for (const card of cards) {
    const isDuplicate = unique.some((existing) => {
      const similarity = calculateTextSimilarity(card.front, existing.front);
      return similarity > 0.8;
    });
    if (!isDuplicate) {
      unique.push(card);
    }
  }
  return unique;
}
__name(deduplicateFlashcards, "deduplicateFlashcards");
function calculateTextSimilarity(text1, text2) {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = /* @__PURE__ */ new Set([...words1, ...words2]);
  return intersection.size / union.size;
}
__name(calculateTextSimilarity, "calculateTextSimilarity");
async function rankFlashcardsByQuality(cards, env2) {
  if (cards.length <= 20) {
    const systemPrompt = `Evaluate these flashcards for quality.
Rate each card 1-10 based on:
- Clarity of question
- Accuracy of answer
- Educational value
- Appropriate difficulty

Return JSON array of scores in same order: [8, 7, 9, ...]`;
    try {
      const cardsJson = JSON.stringify(cards.map((c) => ({ front: c.front, back: c.back })));
      const scores = await generateJSON(
        cardsJson,
        systemPrompt,
        "[1, 2, 3, ...]",
        env2
      );
      const scored = cards.map((card, idx) => ({
        card,
        score: scores[idx] || 5
      }));
      scored.sort((a, b) => b.score - a.score);
      return scored.map((s) => s.card);
    } catch {
      return cards;
    }
  }
  return cards;
}
__name(rankFlashcardsByQuality, "rankFlashcardsByQuality");
async function getSourceTitle(sourceId, content, env2) {
  const systemPrompt = `Based on this content, generate a short title (5-8 words) that describes what this is about.
Return only the title text.`;
  const prompt = content.substring(0, 500);
  return generateText(prompt, systemPrompt, env2, {
    temperature: 0.5,
    maxTokens: 30
  });
}
__name(getSourceTitle, "getSourceTitle");
async function generateClozeCards(sourceId, count3, env2) {
  const chunks = await searchRelevantChunks("important facts and key information", sourceId, 10, env2);
  const content = chunks.map((c) => c.content).join("\n\n");
  const systemPrompt = `Create ${count3} cloze deletion flashcards (fill-in-the-blank).

For each card:
- Front: Sentence with [...] replacing a key term
- Back: The missing term/phrase
- Hint: Context clue

Example:
Front: "The [...] is the powerhouse of the cell."
Back: "mitochondria"
Hint: "Organelle responsible for energy production"

Return JSON array:
[{
  "front": "Sentence with [...]",
  "back": "Missing term",
  "hint": "Context clue",
  "difficulty": 1-10,
  "topic": "Topic name",
  "sourceReference": "Original sentence"
}]`;
  const prompt = `Content:

${content.substring(0, 6e3)}`;
  const schema = `[{"front": "...", "back": "...", "hint": "...", "difficulty": 1-10, "topic": "...", "sourceReference": "..."}]`;
  return generateJSON(prompt, systemPrompt, schema, env2);
}
__name(generateClozeCards, "generateClozeCards");

// workers/lib/audio-overview.ts
async function generateAudioOverview(request, env2) {
  const { sourceId, style = "conversational", duration = 300 } = request;
  const chunks = await searchRelevantChunks("main topics, key concepts, and interesting points", sourceId, 25, env2);
  const content = chunks.map((c) => c.content).join("\n\n");
  const script = await generateDialogueScript(content, style, duration, env2);
  const audioResult = await synthesizeSpeech(script, env2);
  return {
    audioUrl: audioResult.audioUrl,
    transcript: script.fullTranscript,
    speakers: script.speakers,
    duration: audioResult.duration
  };
}
__name(generateAudioOverview, "generateAudioOverview");
async function generateDialogueScript(content, style, targetDuration, env2) {
  const wordsPerMinute = 150;
  const targetWords = targetDuration / 60 * wordsPerMinute;
  let systemPrompt = "";
  switch (style) {
    case "conversational":
      systemPrompt = `Create an engaging podcast-style conversation between two hosts discussing this content.

Hosts:
- Alex (curious learner, asks questions)
- Jamie (knowledgeable guide, explains concepts)

Guidelines:
- Natural, conversational tone
- Use "we", "you know", "actually" naturally
- Ask clarifying questions
- Make connections to real-world examples
- Show enthusiasm for interesting points
- Target approximately ${Math.floor(targetWords)} words
- Break complex ideas into digestible explanations
- Use analogies and metaphors

Format each line as:
SPEAKER: dialogue text`;
      break;
    case "lecture":
      systemPrompt = `Create an educational lecture presentation on this content.

Speaker: Professor Morgan (expert educator)

Guidelines:
- Structured and organized
- Clear explanations with examples
- Build from fundamentals to complex ideas
- Emphasize key takeaways
- Target approximately ${Math.floor(targetWords)} words
- Professional but accessible tone

Format each line as:
PROFESSOR: lecture text`;
      break;
    case "debate":
      systemPrompt = `Create a friendly debate between two perspectives on this content.

Debaters:
- Riley (Perspective A)
- Sam (Perspective B)

Guidelines:
- Present different viewpoints or interpretations
- Support arguments with evidence from material
- Respectful disagreement
- Find common ground
- Target approximately ${Math.floor(targetWords)} words

Format each line as:
SPEAKER: dialogue text`;
      break;
  }
  const prompt = `Content to discuss:

${content.substring(0, 1e4)}`;
  const dialogue = await generateText(prompt, systemPrompt, env2, {
    temperature: 0.9,
    // Higher temperature for more natural conversation
    maxTokens: Math.ceil(targetWords * 1.5)
  });
  const lines = dialogue.split("\n").filter((line) => line.trim());
  const segments = /* @__PURE__ */ new Map();
  let timestamp = 0;
  for (const line of lines) {
    const match = line.match(/^([A-Z]+):\s*(.+)$/);
    if (!match) continue;
    const [, speaker, text] = match;
    const words = text.split(/\s+/).length;
    const segmentDuration = words / wordsPerMinute * 60;
    if (!segments.has(speaker)) {
      segments.set(speaker, []);
    }
    segments.get(speaker).push({
      timestamp,
      text: text.trim()
    });
    timestamp += segmentDuration;
  }
  const speakers = Array.from(segments.entries()).map(([name, segs], idx) => ({
    name,
    voice: getVoiceForSpeaker(name, idx),
    segments: segs
  }));
  return {
    speakers,
    fullTranscript: dialogue
  };
}
__name(generateDialogueScript, "generateDialogueScript");
async function synthesizeSpeech(script, env2) {
  const allSegments = [];
  for (const speaker of script.speakers) {
    for (const segment of speaker.segments) {
      allSegments.push({
        timestamp: segment.timestamp,
        text: segment.text,
        voice: speaker.voice
      });
    }
  }
  allSegments.sort((a, b) => a.timestamp - b.timestamp);
  const audioChunks = [];
  let totalDuration = 0;
  for (const segment of allSegments) {
    try {
      const ttsResponse = await env2.AI.run("@cf/meta/m2m100-1.2b", {
        text: segment.text,
        source_lang: "en",
        target_lang: "en"
      });
      const audioBuffer = await synthesizeWithExternalTTS(segment.text, segment.voice, env2);
      audioChunks.push(audioBuffer);
      const words = segment.text.split(/\s+/).length;
      totalDuration += words / 150 * 60;
    } catch (error3) {
      console.error("TTS error:", error3);
    }
  }
  const combinedAudio = combineAudioBuffers(audioChunks);
  let audioUrl = "";
  if (env2.AUDIO_BUCKET) {
    const audioKey = `audio-overviews/${crypto.randomUUID()}.mp3`;
    await env2.AUDIO_BUCKET.put(audioKey, combinedAudio, {
      httpMetadata: {
        contentType: "audio/mpeg"
      }
    });
    audioUrl = `https://audio.edufeed.com/${audioKey}`;
  } else {
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(combinedAudio)));
    audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
  }
  return {
    audioUrl,
    duration: totalDuration
  };
}
__name(synthesizeSpeech, "synthesizeSpeech");
async function synthesizeWithExternalTTS(text, voice, env2) {
  return new ArrayBuffer(0);
}
__name(synthesizeWithExternalTTS, "synthesizeWithExternalTTS");
function combineAudioBuffers(buffers) {
  const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const buffer of buffers) {
    combined.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }
  return combined.buffer;
}
__name(combineAudioBuffers, "combineAudioBuffers");
function getVoiceForSpeaker(name, index) {
  const voiceMap = {
    ALEX: "voice_id_casual_curious",
    JAMIE: "voice_id_knowledgeable_friendly",
    PROFESSOR: "voice_id_authoritative_clear",
    RILEY: "voice_id_thoughtful_articulate",
    SAM: "voice_id_analytical_engaging"
  };
  return voiceMap[name] || `voice_${index}`;
}
__name(getVoiceForSpeaker, "getVoiceForSpeaker");

// workers/index.ts
var workers_default = {
  async fetch(request, env2) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      switch (true) {
        // Health check
        case path === "/health":
          return jsonResponse({ status: "ok", timestamp: Date.now() }, 200, corsHeaders);
        // Embeddings endpoints
        case (path === "/api/embeddings/store" && request.method === "POST"):
          return handleStoreEmbeddings(request, env2, corsHeaders);
        case (path === "/api/embeddings/delete" && request.method === "DELETE"):
          return handleDeleteEmbeddings(request, env2, corsHeaders);
        // Chat endpoints
        case (path === "/api/chat" && request.method === "POST"):
          return handleChat(request, env2, corsHeaders);
        case (path === "/api/chat/continue" && request.method === "POST"):
          return handleContinueChat(request, env2, corsHeaders);
        // Study guide endpoints
        case (path === "/api/study-guide/generate" && request.method === "POST"):
          return handleGenerateStudyGuide(request, env2, corsHeaders);
        case (path === "/api/study-guide/plan" && request.method === "POST"):
          return handleGenerateStudyPlan(request, env2, corsHeaders);
        // Flashcard endpoints
        case (path === "/api/flashcards/generate" && request.method === "POST"):
          return handleGenerateFlashcards(request, env2, corsHeaders);
        case (path === "/api/flashcards/generate-cloze" && request.method === "POST"):
          return handleGenerateClozeCards(request, env2, corsHeaders);
        // Audio overview endpoints
        case (path === "/api/audio-overview/generate" && request.method === "POST"):
          return handleGenerateAudioOverview(request, env2, corsHeaders);
        default:
          return jsonResponse({ error: "Not found" }, 404, corsHeaders);
      }
    } catch (error3) {
      console.error("Error handling request:", error3);
      return jsonResponse(
        {
          error: "Internal server error",
          message: error3 instanceof Error ? error3.message : "Unknown error"
        },
        500,
        corsHeaders
      );
    }
  }
};
async function handleStoreEmbeddings(request, env2, corsHeaders) {
  const { sourceId, content, metadata } = await request.json();
  if (!sourceId || !content) {
    return jsonResponse({ error: "Missing required fields" }, 400, corsHeaders);
  }
  await storeDocumentEmbeddings(sourceId, content, metadata, env2);
  return jsonResponse(
    { success: true, message: "Embeddings stored successfully" },
    200,
    corsHeaders
  );
}
__name(handleStoreEmbeddings, "handleStoreEmbeddings");
async function handleDeleteEmbeddings(request, env2, corsHeaders) {
  const { sourceId } = await request.json();
  if (!sourceId) {
    return jsonResponse({ error: "Missing sourceId" }, 400, corsHeaders);
  }
  await deleteSourceEmbeddings(sourceId, env2);
  return jsonResponse(
    { success: true, message: "Embeddings deleted successfully" },
    200,
    corsHeaders
  );
}
__name(handleDeleteEmbeddings, "handleDeleteEmbeddings");
async function handleChat(request, env2, corsHeaders) {
  const chatRequest = await request.json();
  if (!chatRequest.sourceId || !chatRequest.message) {
    return jsonResponse({ error: "Missing required fields" }, 400, corsHeaders);
  }
  const response = await chatWithDocument(chatRequest, env2);
  return jsonResponse(response, 200, corsHeaders);
}
__name(handleChat, "handleChat");
async function handleContinueChat(request, env2, corsHeaders) {
  const { conversationId, message } = await request.json();
  if (!conversationId || !message) {
    return jsonResponse({ error: "Missing required fields" }, 400, corsHeaders);
  }
  const response = await continueChatConversation(conversationId, message, env2);
  return jsonResponse(response, 200, corsHeaders);
}
__name(handleContinueChat, "handleContinueChat");
async function handleGenerateStudyGuide(request, env2, corsHeaders) {
  const studyGuideRequest = await request.json();
  if (!studyGuideRequest.sourceId) {
    return jsonResponse({ error: "Missing sourceId" }, 400, corsHeaders);
  }
  const studyGuide = await generateStudyGuide(studyGuideRequest, env2);
  return jsonResponse(studyGuide, 200, corsHeaders);
}
__name(handleGenerateStudyGuide, "handleGenerateStudyGuide");
async function handleGenerateStudyPlan(request, env2, corsHeaders) {
  const { studyGuide, targetDays } = await request.json();
  if (!studyGuide || !targetDays) {
    return jsonResponse({ error: "Missing required fields" }, 400, corsHeaders);
  }
  const plan = await generateStudyPlan(studyGuide, targetDays, env2);
  return jsonResponse(plan, 200, corsHeaders);
}
__name(handleGenerateStudyPlan, "handleGenerateStudyPlan");
async function handleGenerateFlashcards(request, env2, corsHeaders) {
  const flashcardRequest = await request.json();
  if (!flashcardRequest.sourceId) {
    return jsonResponse({ error: "Missing sourceId" }, 400, corsHeaders);
  }
  const flashcards = await generateFlashcards(flashcardRequest, env2);
  return jsonResponse(flashcards, 200, corsHeaders);
}
__name(handleGenerateFlashcards, "handleGenerateFlashcards");
async function handleGenerateClozeCards(request, env2, corsHeaders) {
  const { sourceId, count: count3 } = await request.json();
  if (!sourceId) {
    return jsonResponse({ error: "Missing sourceId" }, 400, corsHeaders);
  }
  const cards = await generateClozeCards(sourceId, count3 || 10, env2);
  return jsonResponse({ cards }, 200, corsHeaders);
}
__name(handleGenerateClozeCards, "handleGenerateClozeCards");
async function handleGenerateAudioOverview(request, env2, corsHeaders) {
  const audioRequest = await request.json();
  if (!audioRequest.sourceId) {
    return jsonResponse({ error: "Missing sourceId" }, 400, corsHeaders);
  }
  const audioOverview = await generateAudioOverview(audioRequest, env2);
  return jsonResponse(audioOverview, 200, corsHeaders);
}
__name(handleGenerateAudioOverview, "handleGenerateAudioOverview");
function jsonResponse(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}
__name(jsonResponse, "jsonResponse");

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError(e);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-e01auW/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = workers_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-e01auW/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
