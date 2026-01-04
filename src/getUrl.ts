/**
 * GetUrlFunc for ethers.js FetchRequest class
 *
 * Fixes default timeout of 5000ms from 'node:http' request because it doesn't apply for fetch request
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { assert, type FetchGetUrlFunc } from 'ethers';
import type { Dispatcher, RequestInit, fetch as nodeFetch } from 'undici-types';

export interface fetchOptions extends Omit<RequestInit, 'headers'> {
    headers?: any;
    timeout?: number;
    dispatcher?: Dispatcher;
}

export function getUrlFunc(options?: fetchOptions): FetchGetUrlFunc {
    return async (req, signal) => {
        let timer;

        try {
            const init: RequestInit = {
                ...(options || {}),
                method: req.method || 'POST',
                headers: req.headers,
                body: req.body,
            };

            const timeout = options?.timeout || req.timeout;

            if (timeout) {
                const controller = new AbortController();

                init.signal = controller.signal;

                timer = setTimeout(() => {
                    controller.abort();
                }, timeout);

                if (signal) {
                    assert(
                        signal === null || !signal.cancelled,
                        'request cancelled before sending',
                        'CANCELLED',
                    );

                    signal.addListener(() => {
                        controller.abort();
                    });
                }
            }

            const resp = await (fetch as unknown as typeof nodeFetch)(req.url, init);

            const headers = {} as Record<string, any>;
            resp.headers.forEach((value: any, key: string) => {
                headers[key.toLowerCase()] = value;
            });

            const respBody = await resp.arrayBuffer();
            const body = respBody ? new Uint8Array(respBody) : null;

            return {
                statusCode: resp.status,
                statusMessage: resp.statusText,
                headers,
                body,
            };
        } finally {
            clearTimeout(timer);
        }
    };
}
