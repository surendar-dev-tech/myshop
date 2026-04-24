export const environment = {
  production: false,
  /**
   * Must match the running backend. This project uses Spring Boot:
   * `server.port` + `server.servlet.context-path` → http://localhost:8080/api
   *
   * For another machine / reverse proxy (e.g. http://192.168.x.x:5080/v1), change only this value.
   */
  apiUrl: 'http://localhost:8080/api',

  /**
   * QZ Tray (https://qz.io): install on each POS machine, enable “Allow unsigned requests” for dev,
   * or configure signing + backend /sign for production. Shows “Print receipt (thermal)” on invoices.
   */
  qzTray: {
    enabled: false,
    scriptUrl: 'https://cdn.jsdelivr.net/npm/qz-tray@2.2.4/qz-tray.js'
  }
};
