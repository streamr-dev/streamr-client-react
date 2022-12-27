import type { StreamrClient, Subscription } from 'streamr-client'
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

export default function subscribe(
    streamId: string,
    streamrClient: StreamrClient,
    { ignoreUndecodedMessages = false, onMessageError, onError }: Options = {}
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
                sub = await streamrClient.subscribe({
                    streamId,
                })

                if (cancelled) {
                    return void unsub()
                }

                // @ts-expect-error `onMessage` is internal. #lifehack
                sub.onMessage.listen((streamMessage: StreamMessage) => {
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
