#lang racket
;; Seashell's login gateway.
;; Copyright (C) 2013 The Seashell Maintainers.
;;
;; This program is free software: you can redistribute it and/or modify
;; it under the terms of the GNU General Public License as published by
;; the Free Software Foundation, either version 3 of the License, or
;; (at your option) any later version.
;;
;; See also 'ADDITIONAL TERMS' at the end of the included LICENSE file.
;;
;; This program is distributed in the hope that it will be useful,
;; but WITHOUT ANY WARRANTY; without even the implied warranty of
;; MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
;; GNU General Public License for more details.
;;
;; You should have received a copy of the GNU General Public License
;; along with this program.  If not, see <http://www.gnu.org/licenses/>.
(require net/cgi
         net/url
         seashell/seashell-config
         seashell/log
         seashell/format-trace
         seashell/tunnel
         seashell/crypto
         racket/sandbox
         json)

(provide gateway-main)

;; The gateway CGI expects a username 'u' and password 'p' argument
;; as POST data. It will only run when the webserver reports an SSL
;; connection.
;;  (this is to ensure user has correct Apache config; only SSL
;;   requests should be permitted to this script).

(define (gateway-main)
  (define (response/json jsexpr)
    (printf "Access-Control-Allow-Origin: *\r\n")
    (printf "Content-Type: application/json\r\n\r\n")
    (write-json jsexpr)
    (printf "\r\n")
    (flush-output))
  (define (report-error code desc)
    (response/json `#hash((error . #hash((code . ,code) (message . ,desc)))))
    (exit 0))

  (make-port-logger "^info$" (current-error-port))
  (make-port-logger "^warn$" (current-error-port))
  (make-port-logger "^exception$" (current-error-port))

  (define ss-exn-handler
    (lambda(e)
      (when (not (exn:break? e))
        (if (read-config 'debug)
            (logf/sync 'exception "~a:~ntrace: ~a"
              (exn-message e)
              (foldl string-append ""
                    (format-stack-trace
                      (continuation-mark-set->context
                      (exn-continuation-marks e)))))
            (logf/sync 'exception
                       "Encountered an exception. Turn debug mode on for information [insecure].")))
      ((error-escape-handler))))

  ;; TODO
  ;(uncaught-exception-handler ss-exn-handler)

  (unless
    (equal? (getenv "HTTPS") "on")
    (logf/sync 'warn "Refusing to operate over a non-SSL connection.")
    (report-error 1 "Requires SSL."))

  (unless
    (equal? (get-cgi-method) "POST")
    (report-error 2 "Requires POST request method."))

  (define bdgs (get-bindings))

  (define uname
    (let ((l (extract-bindings 'u bdgs)))
      (unless (= (length l) 1)
        (report-error 3 "Bad username provided."))
      (first l)))

  (define passwd
    (let ((l (extract-bindings 'p bdgs)))
      (unless (= (length l) 1)
        (report-error 3 "Bad password provided."))
      (first l)))

  ;; Binding for tunnel process outside scope of with-limits.
  (define tun-proc #f)

  ;; Timeout the login process.
  (with-handlers
    ([exn:fail:resource? (lambda(e)
                           (when tun-proc
                             (subprocess-kill tun-proc #t))
                           (report-error 7 "Login timed out."))])
    (with-limits (read-config 'backend-login-timeout) #f
      ;; Spawn backend process on backend host.
      (define tun
        (with-handlers
          ([exn:tunnel?
             (match-lambda
               [(exn:tunnel message marks 7)
                (report-error 5 "Invalid credentials.")]
               [(exn:tunnel message marks 6)
                (report-error 6 "Invalid host key. See server log.")]
               [(exn:tunnel message marks code)
                (report-error 4 (format "Session could not be started (internal error, code=~a)." code))])])
          (tunnel-launch uname passwd)))

      (set! tun-proc (tunnel-process tun))

      ;; Key generation
      (define shared-key (seashell-crypt-make-key))

      (logf/sync 'info "Remote address is ~a" (tunnel-remote-addr tun))
      (logf/sync 'info "Key is ~a bytes: ~s" (bytes-length shared-key) shared-key)

      ;; Send key to backend process
      (write-bytes shared-key (tunnel-out tun))
      (flush-output (tunnel-out tun))

      (logf/sync 'info "Waiting for tunnel port.")
      ;; Get initialization info from backend process
      (define be-address (tunnel-remote-addr tun))
      (define be-port (read-line (tunnel-in tun)))

      (logf/sync 'info "Waiting for tunnel shutdown.")
      ;; Wait for tunnel shutdown.
      (subprocess-wait (tunnel-process tun))

      ;; Check for graceful exit.
      (when (not (= 0 (subprocess-status (tunnel-process tun))))
        (report-error 4 (format "Session could not be started (internal error, code=~a)."
                                (subprocess-status (tunnel-process tun)))))

      ;; Send key, address, and port to client.
      ;; This duplicates some code in seashell/crypto.
      (response/json
        `#hash((key . ,(for/list ([i (in-range 0 4)])
                                 (integer-bytes->integer (subbytes shared-key (* 4 i) (* 4 (add1 i))) #t #t)))
               (host . ,be-address)
               (port . ,be-port)))))

  (exit 0))
