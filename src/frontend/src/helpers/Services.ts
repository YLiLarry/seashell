import * as $ from "jquery";
import {SeashellWebsocket} from "./Websocket/WebsocketClient";
import {WebStorage} from "./Storage/WebStorage";
import {LocalStorage} from "./Storage/LocalStorage";
import {AbstractStorage,
        File, FileID, FileBrief,
        Project, ProjectID, ProjectBrief,
        Settings, defaultSettings} from "./Storage/Interface";
import {OnlineCompiler} from "./Compiler/OnlineCompiler";
import {OfflineCompiler} from "./Compiler/OfflineCompiler";
import {AbstractCompiler,
        Test,
        CompilerResult,
        CompilerDiagnostic} from "./Compiler/Interface";
import {LoginError} from "./Errors";
export * from "./Storage/Interface";
export * from "./Compiler/Interface";
export {Services, Connection, DispatchFunction};


class Connection {
  public wsURI: string;

  constructor(public username: string,
              public key: number[],
              public host: string,
              public port: number,
              public pingPort: number) {
    this.wsURI = `wss://${this.host}:${this.port}`;
  };
}

type DispatchFunction = (act: Object) => Object;

namespace Services {
  let connection: Connection;
  let dispatch: DispatchFunction | null = null;
  let socketClient: SeashellWebsocket | null = null;
  let localStorage: LocalStorage | null = null;
  let webStorage: WebStorage | null = null;
  let offlineCompiler: OfflineCompiler | null = null;
  let onlineCompiler: OnlineCompiler | null = null;
  let debug: boolean;

  export function init(disp: DispatchFunction,
                       options?: { debugService?: boolean;
                                   debugWebSocket?: boolean;
                                   debugWebStorage?: boolean; }) {
    dispatch = disp;
    options = options || {};
    debug = options.debugService || false;
    socketClient = new SeashellWebsocket(options.debugWebSocket);
    localStorage = new LocalStorage();
    webStorage = new WebStorage(socketClient, localStorage, options.debugWebStorage);
    offlineCompiler = new OfflineCompiler(localStorage, dispatch);
    onlineCompiler = new OnlineCompiler(socketClient, webStorage, offlineCompiler, dispatch);
  }

  export function storage(): WebStorage {
    if (webStorage === null) {
      throw new Error("Must call Services.init() before Services.storage().");
    }
    return webStorage;
  }

  export function compiler(): AbstractCompiler {
    if (onlineCompiler === null) {
      throw new Error("Must call Services.init() before Services.compiler().");
    }
    return onlineCompiler;
  }

  export async function login(user: string,
                              password: string,
                              rebootBackend?: boolean,
                              uri?: string): Promise<void> {
    uri = uri || "https://www.student.cs.uwaterloo.ca/~cs136/seashell/cgi-bin/login2.cgi";
    if (!localStorage || !socketClient) {
      throw new Error("Must call Services.init() before Services.login()");
    }
    try {
      debug && console.log("Logging in...");
      const response = await <PromiseLike<any>>$.ajax({
        url: uri,
        type: "POST",
        data: {
          "u": user,
          "p": password,
          "reset": !! rebootBackend
        },
        dataType: "json"
      });
      debug && console.log("Login succeeded.");
      connection = new Connection(user,
                                  response.key,
                                  response.host,
                                  response.port,
                                  response.pingPort);
    } catch (ajax) {
      const status     = ajax.status;
      const code       = ajax.responseJSON.error.code;
      const msg        = ajax.responseJSON.error.message;
      const statusText = ajax.statusText;
      throw new LoginError(`Login failure (${code}): ${msg}`, user, status, statusText);
    }

    // login successful
    await localStorage.connect(`seashell-${connection.username}`);
    await socketClient.connect(connection);
  }

  export async function logout() {
    if (socketClient)
      await socketClient.disconnect();
    debug && console.log("User logged out.");
  }
}
