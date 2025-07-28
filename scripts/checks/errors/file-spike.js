"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log('--- TOP OF FILE ---');
var promises_1 = require("fs/promises");
var fs_1 = require("fs");
// import { dirname } from 'path';
console.log('=== Node.js File Operation Error Spike ===\n');
// Helper to capture error details
function tryOperation(name, operation) {
    return __awaiter(this, void 0, void 0, function () {
        var result, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\n--- ".concat(name, " ---"));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, operation()];
                case 2:
                    result = _a.sent();
                    console.log('SUCCESS:', result);
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.log('ERROR CODE:', err_1.code);
                    console.log('ERROR MESSAGE:', err_1.message);
                    console.log('ERROR SYSCALL:', err_1.syscall);
                    console.log('ERROR PATH:', err_1.path);
                    console.log('ERROR DEST:', err_1.dest);
                    console.log('FULL ERROR:', err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
console.log('Script started!');
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var testDir, rmSync_1, rmSync;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Main is running');
                    return [4 /*yield*/, tryOperation('Simple write to /tmp', function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, promises_1.writeFile)('/tmp/test-check.txt', 'Hello world')];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/, 'Wrote /tmp/test-check.txt'];
                                }
                            });
                        }); })];
                case 1:
                    _a.sent();
                    testDir = '/tmp/spike-test';
                    if (!(0, fs_1.existsSync)(testDir)) return [3 /*break*/, 3];
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('fs'); })];
                case 2:
                    rmSync_1 = (_a.sent()).rmSync;
                    rmSync_1(testDir, { recursive: true, force: true });
                    _a.label = 3;
                case 3:
                    (0, fs_1.mkdirSync)(testDir);
                    // Test 1: Delete non-existent file
                    return [4 /*yield*/, tryOperation('Delete non-existent file', function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, promises_1.unlink)('/tmp/spike-test/does-not-exist.txt')];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 4:
                    // Test 1: Delete non-existent file
                    _a.sent();
                    // Test 2: Delete from read-only location
                    return [4 /*yield*/, tryOperation('Delete from /root/', function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, promises_1.unlink)('/root/test.txt')];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 5:
                    // Test 2: Delete from read-only location
                    _a.sent();
                    // Test 3: Move non-existent file
                    return [4 /*yield*/, tryOperation('Move non-existent file', function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, promises_1.rename)('/tmp/spike-test/ghost.txt', '/tmp/spike-test/moved.txt')];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 6:
                    // Test 3: Move non-existent file
                    _a.sent();
                    // Test 4: Move to non-existent directory
                    (0, fs_1.writeFileSync)('/tmp/spike-test/source.txt', 'test');
                    return [4 /*yield*/, tryOperation('Move to non-existent directory', function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, promises_1.rename)('/tmp/spike-test/source.txt', '/tmp/spike-test/subdir/dest.txt')];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 7:
                    _a.sent();
                    // Test 5: Move from/to /root/
                    return [4 /*yield*/, tryOperation('Move from /root/', function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, promises_1.rename)('/root/source.txt', '/tmp/spike-test/dest.txt')];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 8:
                    // Test 5: Move from/to /root/
                    _a.sent();
                    (0, fs_1.writeFileSync)('/tmp/spike-test/moveable.txt', 'test');
                    return [4 /*yield*/, tryOperation('Move to /root/', function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, promises_1.rename)('/tmp/spike-test/moveable.txt', '/root/dest.txt')];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 9:
                    _a.sent();
                    // Test 6: Write to /root/
                    return [4 /*yield*/, tryOperation('Write to /root/', function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, promises_1.writeFile)('/root/test.txt', 'content')];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 10:
                    // Test 6: Write to /root/
                    _a.sent();
                    // Test 7: Create directory in /root/
                    return [4 /*yield*/, tryOperation('Create directory in /root/', function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, promises_1.mkdir)('/root/testdir')];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 11:
                    // Test 7: Create directory in /root/
                    _a.sent();
                    // Test 8: Move with overwrite
                    (0, fs_1.writeFileSync)('/tmp/spike-test/src-exists.txt', 'source');
                    (0, fs_1.writeFileSync)('/tmp/spike-test/dst-exists.txt', 'destination');
                    return [4 /*yield*/, tryOperation('Move overwriting existing file', function () { return __awaiter(_this, void 0, void 0, function () {
                            var content;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, promises_1.rename)('/tmp/spike-test/src-exists.txt', '/tmp/spike-test/dst-exists.txt')];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, (0, promises_1.readFile)('/tmp/spike-test/dst-exists.txt', 'utf8')];
                                    case 2:
                                        content = _a.sent();
                                        return [2 /*return*/, "Overwrite successful. Content: \"".concat(content, "\"")];
                                }
                            });
                        }); })];
                case 12:
                    _a.sent();
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('fs'); })];
                case 13:
                    rmSync = (_a.sent()).rmSync;
                    rmSync(testDir, { recursive: true, force: true });
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error);
