import LiveKit

final class SampleHandler: LKSampleHandler {
    // Avoid verbose production logging of media/session details.
    override var enableLogging: Bool { false }
}
