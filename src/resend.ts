import type { ResendOptions, StreamrClient, Message, StreamDefinition } from 'streamr-client'
import { FlowControls, Options } from './subscribe'

export default function resend(
    stream: StreamDefinition,
    options: ResendOptions,
    streamrClient: StreamrClient,
    { ignoreUndecodedMessages = false, onMessageError, onError }: Options = {}
): FlowControls<Message> {
    const rs = new ReadableStream<Message>({
        async start(controller: ReadableStreamDefaultController<Message>) {
            try {
                const queue = await streamrClient.resend(stream, options)

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

                for await (const msg of queue) {
                    controller.enqueue(msg)
                }
            } catch (e) {
                onError?.(e)
            } finally {
                controller.close()
            }
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
