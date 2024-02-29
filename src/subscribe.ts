import type { ResendOptions, StreamDefinition, StreamrClient, Subscription } from '@streamr/sdk'
import type { StreamMessage } from 'streamr-client-protocol'

export interface FlowControls<T = unknown> {
    next: () => Promise<ReadableStreamReadResult<T>>
    abort: () => Promise<void>
}

export interface Options {
    ignoreUndecodedMessages?: boolean
    onError?: (e: any) => void
    onMessageError?: (e: any) => void
}

interface SubscribeOptions extends Options {
    resendOptions?: ResendOptions
}

export default function subscribe(
    stream: StreamDefinition,
    streamrClient: StreamrClient,
    {
        ignoreUndecodedMessages = false,
        onError,
        onMessageError,
        resendOptions,
    }: SubscribeOptions = {}
): FlowControls<StreamMessage> {
    let sub: undefined | Subscription

    let cancelled = false

    function unsub() {
        if (sub) {
            streamrClient.unsubscribe(sub)
            sub = undefined
        }
    }

    const rs = new ReadableStream<StreamMessage>({
        async start(controller: ReadableStreamDefaultController<StreamMessage>) {
            try {
                // @ts-expect-error `destroySignal` is private.
                if (streamrClient.destroySignal.isDestroyed()) {
                    return
                }

                const options =
                    typeof stream === 'string'
                        ? {
                              id: stream,
                          }
                        : stream

                sub = await streamrClient.subscribe(
                    {
                        ...options,
                        resend: resendOptions,
                    },
                    // Does not fly without the "legacy" on-message callback.
                    () => {}
                )

                if (cancelled) {
                    return void unsub()
                }

                // @ts-expect-error `pipeline.onMessage` is internal. #lifehack
                sub.pipeline.onMessage.listen((streamMessage: StreamMessage) => {
                    controller.enqueue(streamMessage)
                })

                sub.on('error', (e: any) => {
                    onMessageError?.(e)

                    const raw = e.streamMessage

                    if (!raw) {
                        return
                    }

                    if (!ignoreUndecodedMessages) {
                        controller.enqueue(raw as StreamMessage)
                    }
                })
            } catch (e) {
                onError?.(e)
                controller.close()
            }
        },
        cancel() {
            unsub()
            cancelled = true
        },
    })

    const reader = rs.getReader()

    return {
        async next() {
            return reader.read()
        },
        async abort() {
            await reader.cancel()
        },
    }
}
