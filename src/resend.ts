import type { ResendOptions, StreamDefinition, StreamrClient } from 'streamr-client'
import type { StreamMessage } from 'streamr-client-protocol'
import { FlowControls, Options } from './subscribe'

export default function resend(
    stream: StreamDefinition,
    options: ResendOptions,
    streamrClient: StreamrClient,
    { ignoreUndecodedMessages = false, onMessageError, onError }: Options = {}
): FlowControls<StreamMessage> {
    let cancelled = false

    const rs = new ReadableStream<StreamMessage>({
        async start(controller: ReadableStreamDefaultController<StreamMessage>) {
            try {
                const queue = await streamrClient.resend(stream, options)

                if (cancelled) {
                    return
                }

                // @ts-expect-error `onMessage` is internal. #lifehack
                queue.onMessage.listen((streamMessage: StreamMessage) => {
                    controller.enqueue(streamMessage)
                })

                // @ts-expect-error `onError` is internal.
                queue.onError.listen((e: any) => {
                    if (typeof onMessageError === 'function') {
                        onMessageError(e)
                    }

                    const msg = e.streamMessage

                    if (!msg) {
                        return
                    }

                    if (!ignoreUndecodedMessages) {
                        controller.enqueue(msg)
                    }
                })
            } catch (e) {
                onError?.(e)
            } finally {
                controller.close()
            }
        },
        cancel() {
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
